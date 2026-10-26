import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const AWS_REGION = 'us-east-1';
const TABLE_NAME = 'PixelatedEmailRouting';
const shouldApply = process.argv.includes('--apply');

function getDomainFromRecipient(recipient) {
	const value = String(recipient || '').trim().toLowerCase();
	const domain = value.startsWith('@') ? value.slice(1) : value.slice(value.lastIndexOf('@') + 1);
	return domain.includes('.') ? domain : '';
}

async function backfillDomains() {
	const client = new DynamoDBClient({ region: AWS_REGION });
	let exclusiveStartKey;
	let scannedCount = 0;
	let updatedCount = 0;
	let skippedCount = 0;

	do {
		const response = await client.send(new ScanCommand({
			TableName: TABLE_NAME,
			ProjectionExpression: '#recipient, #domain',
			ExpressionAttributeNames: { '#recipient': 'recipient', '#domain': 'domain' },
			ExclusiveStartKey: exclusiveStartKey,
		}));

		for (const item of response.Items || []) {
			scannedCount += 1;
			if (item.domain?.S) continue;

			const recipient = item.recipient?.S || '';
			const domain = getDomainFromRecipient(recipient);
			if (!domain) {
				skippedCount += 1;
				console.warn(`Skipped ${recipient || '(missing recipient)'}: unable to derive domain.`);
				continue;
			}

			if (shouldApply) {
				await client.send(new UpdateItemCommand({
					TableName: TABLE_NAME,
					Key: { recipient: { S: recipient } },
					UpdateExpression: 'SET #domain = :domain',
					ExpressionAttributeNames: { '#domain': 'domain' },
					ExpressionAttributeValues: { ':domain': { S: domain } },
					ConditionExpression: 'attribute_not_exists(#domain)',
				}));
				updatedCount += 1;
				console.log(`Updated ${recipient} with domain ${domain}.`);
			} else {
				updatedCount += 1;
				console.log(`Would update ${recipient} with domain ${domain}.`);
			}
		}

		exclusiveStartKey = response.LastEvaluatedKey;
	} while (exclusiveStartKey);

	console.log(`${shouldApply ? 'Backfill' : 'Dry run'} complete: scanned ${scannedCount}, ${shouldApply ? 'updated' : 'would update'} ${updatedCount}, skipped ${skippedCount}.`);
}

backfillDomains().catch((error) => {
	console.error('Domain backfill failed.', error);
	process.exitCode = 1;
});
