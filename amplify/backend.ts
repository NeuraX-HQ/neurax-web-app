import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { askGemini } from './ask-gemini/resource';
import { processNutrition } from './process-nutrition/resource';
import * as iam from 'aws-cdk-lib/aws-iam';
//import { resizeAndAntiMaliciousImg } from './resize_and_anti_malicious_img/resource';
/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  askGemini,
  processNutrition,
  //resizeAndAntiMaliciousImg,
});

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
