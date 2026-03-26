import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { askBedrock } from './ask-bedrock/resource';
import { processNutrition } from './process-nutrition/resource';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { storage } from './storage/resource';
import { resizeAndAntiMaliciousImg } from './resize_and_anti_malicious_img/resource';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import * as s3 from 'aws-cdk-lib/aws-s3';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  askBedrock,
  processNutrition,
  storage,
  resizeAndAntiMaliciousImg,
});

// Configure S3 Trigger for Image Resizing
const s3Bucket = backend.storage.resources.bucket;
const resizeLambda = backend.resizeAndAntiMaliciousImg.resources.lambda;

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
  rules: [{
    id: 'CleanupIncomingLandingZone',
    status: 'Enabled',
    prefix: 'incoming/',
    expirationInDays: 1
  }]
};

// Cấp quyền cho Lambda processNutrition đọc bảng Food trên DynamoDB
// KHÔNG dùng backend.data.resources.tables để tránh circular dependency
const processNutritionLambda = backend.processNutrition.resources.lambda;

// Quyền ListTables để Lambda tự tìm tên bảng Food
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

// Grant permissions for askBedrock to invoke Bedrock models
const askBedrockLambda = backend.askBedrock.resources.lambda;
askBedrockLambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    resources: [
      "arn:aws:bedrock:ap-southeast-2::foundation-model/qwen.qwen3-vl-235b-a22b",
    ],
  })
);

// Grant askBedrock access to S3 (read voice files) + Transcribe
s3Bucket.grantRead(askBedrockLambda);
s3Bucket.grantDelete(askBedrockLambda);
askBedrockLambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      "transcribe:StartTranscriptionJob",
      "transcribe:GetTranscriptionJob",
    ],
    resources: ["*"],
  })
);

// Pass S3 bucket name to askBedrock Lambda
askBedrockLambda.addEnvironment('STORAGE_BUCKET_NAME', s3Bucket.bucketName);
