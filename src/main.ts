import { bootstrapLocal } from './bootstrap/local.bootstrap';

export { handler } from './bootstrap/sqs.bootstrap';

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  bootstrapLocal();
}

