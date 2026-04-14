import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { aiEngine } from './ai-engine/resource';
import { scanImage } from './scan-image/resource';
import { processNutrition } from './process-nutrition/resource';
import { friendRequest } from './friend-request/resource';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { storage } from './storage/resource';
import { resizeImage } from './resize-image/resource';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import * as s3 from 'aws-cdk-lib/aws-s3';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  aiEngine,
  scanImage,
  processNutrition,
  friendRequest,
  storage,
  resizeImage,
});

// Configure S3 Trigger for Image Resizing
const s3Bucket = backend.storage.resources.bucket;
const resizeLambda = backend.resizeImage.resources.lambda;

s3Bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new LambdaDestination(resizeLambda),
  { prefix: 'incoming/' }
);

// Grant Lambda permissions to manage the S3 bucket
s3Bucket.grantReadWrite(resizeLambda);
s3Bucket.grantDelete(resizeLambda);

// Add Lifecycle Rule to cleanup 'incoming/' after 1 day (Escape Hatch)
const cfnBucket = s3Bucket.node.defaultChild as s3.CfnBucket;
cfnBucket.lifecycleConfiguration = {
  rules: [
    {
      id: 'CleanupIncomingLandingZone',
      status: 'Enabled',
      prefix: 'incoming/',
      expirationInDays: 1
    },
    {
      // Safety net: voice files Lambda failed to delete (Lambda xóa ngay sau khi xử lý)
      id: 'CleanupVoiceRecordings',
      status: 'Enabled',
      prefix: 'voice/',
      expirationInDays: 1
    }
  ]
};

// Cấp quyền cho Lambda processNutrition đọc bảng Food trên DynamoDB
// KHÔNG dùng backend.data.resources.tables để tránh circular dependency
const processNutritionLambda = backend.processNutrition.resources.lambda;

// Pass exact Food table name to avoid discoverTableName() picking wrong table
const cfnProcessNutritionFn = processNutritionLambda.node.defaultChild as cdk.aws_lambda.CfnFunction;
cfnProcessNutritionFn.addPropertyOverride(
  'Environment.Variables.FOOD_TABLE_NAME',
  backend.data.resources.tables['Food'].tableName
);

// Quyền ListTables để Lambda tự tìm tên bảng Food (fallback)
processNutritionLambda.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['dynamodb:ListTables'],
  resources: ['*'],
}));

// Quyền đọc dữ liệu từ bảng Food-*
processNutritionLambda.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'dynamodb:Scan',
    'dynamodb:Query',
    'dynamodb:GetItem',
    'dynamodb:BatchGetItem',
    'dynamodb:DescribeTable',
  ],
  resources: ['arn:aws:dynamodb:*:*:table/Food-*'],
}));

// Grant permissions for aiEngine to invoke Bedrock models
const aiEngineLambda = backend.aiEngine.resources.lambda;
aiEngineLambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    resources: [
      "arn:aws:bedrock:ap-southeast-2::foundation-model/qwen.qwen3-vl-235b-a22b",
    ],
  })
);

// Grant aiEngine access to S3 (read voice files, cleanup) + Transcribe
s3Bucket.grantRead(aiEngineLambda);
s3Bucket.grantDelete(aiEngineLambda);
aiEngineLambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      "transcribe:StartTranscriptionJob",
      "transcribe:GetTranscriptionJob",
      "transcribe:DeleteTranscriptionJob",
    ],
    resources: ["*"],
  })
);

// Grant Transcribe service direct access to read voice files from S3
// Transcribe runs async and needs its own S3 access (Lambda's role doesn't transfer)
s3Bucket.addToResourcePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  principals: [new iam.ServicePrincipal('transcribe.amazonaws.com')],
  actions: ['s3:GetObject'],
  resources: [`${s3Bucket.bucketArn}/voice/*`],
}));

// Grant aiEngine access to Food table (for DB lookup in voiceToFood)
aiEngineLambda.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['dynamodb:ListTables'],
  resources: ['*'],
}));
aiEngineLambda.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['dynamodb:Scan', 'dynamodb:Query', 'dynamodb:GetItem'],
  resources: ['arn:aws:dynamodb:*:*:table/Food-*', 'arn:aws:dynamodb:*:*:table/Food-*/index/*'],
}));

// Pass S3 bucket name + Food table name to aiEngine Lambda via escape hatch
const cfnAiEngineFn = aiEngineLambda.node.defaultChild as cdk.aws_lambda.CfnFunction;
cfnAiEngineFn.addPropertyOverride('Environment.Variables.STORAGE_BUCKET_NAME', s3Bucket.bucketName);
cfnAiEngineFn.addPropertyOverride(
  'Environment.Variables.FOOD_TABLE_NAME',
  backend.data.resources.tables['Food'].tableName
);

// Grant scanImage Lambda read access to S3
const scanImageLambda = backend.scanImage.resources.lambda;
s3Bucket.grantRead(scanImageLambda);

// Grant scanImage Lambda permission to read ECS API key from Secrets Manager
scanImageLambda.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['secretsmanager:GetSecretValue'],
  resources: ['arn:aws:secretsmanager:ap-southeast-2:*:secret:nutritrack/prod/api-keys*'],
}));

// Pass S3 bucket name and ECS URL to scanImage Lambda via escape hatch
const cfnScanImageFn = scanImageLambda.node.defaultChild as cdk.aws_lambda.CfnFunction;
cfnScanImageFn.addPropertyOverride('Environment.Variables.STORAGE_BUCKET_NAME', s3Bucket.bucketName);
cfnScanImageFn.addPropertyOverride(
  'Environment.Variables.ECS_BASE_URL',
  ssm.StringParameter.valueForStringParameter(scanImageLambda.stack, '/nutritrack/ecs/alb_url')
);

// Grant friendRequest Lambda permissions to read/write user + Friendship tables
const friendRequestLambda = backend.friendRequest.resources.lambda;

friendRequestLambda.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'dynamodb:GetItem',
    'dynamodb:PutItem',
    'dynamodb:UpdateItem',
    'dynamodb:DeleteItem',
    'dynamodb:Query',
    'dynamodb:Scan',
    'dynamodb:BatchGetItem',
    'dynamodb:BatchWriteItem',
    'dynamodb:DescribeTable',
    'dynamodb:TransactWriteItems',
  ],
  resources: [
    'arn:aws:dynamodb:*:*:table/user-*',
    'arn:aws:dynamodb:*:*:table/user-*/index/*',
    'arn:aws:dynamodb:*:*:table/Friendship-*',
    'arn:aws:dynamodb:*:*:table/Friendship-*/index/*',
  ],
}));

// Pass exact table names via env vars — eliminates discoverTables() ambiguity
// Works in both sandbox and branch deploy (CDK resolves correct table per environment)
const cfnFriendRequestFn = friendRequestLambda.node.defaultChild as cdk.aws_lambda.CfnFunction;
cfnFriendRequestFn.addPropertyOverride(
  'Environment.Variables.USER_TABLE_NAME',
  backend.data.resources.tables['user'].tableName
);
cfnFriendRequestFn.addPropertyOverride(
  'Environment.Variables.FRIENDSHIP_TABLE_NAME',
  backend.data.resources.tables['Friendship'].tableName
);
