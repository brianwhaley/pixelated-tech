import { ChangeResourceRecordSetsCommand, ListHostedZonesByNameCommand, ListResourceRecordSetsCommand, Route53Client } from '@aws-sdk/client-route-53';
import { getFullPixelatedConfig } from '../config/config';

function getRoute53Client() {
	const aws = getFullPixelatedConfig()?.integrations?.aws;
	return new Route53Client({
		region: 'us-east-2',
		credentials: (aws?.access_key_id && aws?.secret_access_key) ? {
			accessKeyId: aws.access_key_id,
			secretAccessKey: aws.secret_access_key,
			sessionToken: aws.session_token,
		} : undefined,
	});
}

export async function getHostedZoneIdForDomain(domain: string) {
	const response = await getRoute53Client().send(new ListHostedZonesByNameCommand({ DNSName: domain }));
	const zone = response.HostedZones?.find((hostedZone) => hostedZone.Name === `${domain}.`);
	if (!zone?.Id) throw new Error(`Hosted zone not found for ${domain}`);
	return zone.Id.replace('/hostedzone/', '');
}

export async function getRoute53RecordValues(hostedZoneId: string, name: string, type: 'CNAME' | 'MX' | 'TXT') {
	const response = await getRoute53Client().send(new ListResourceRecordSetsCommand({
		HostedZoneId: hostedZoneId,
		StartRecordName: name,
		StartRecordType: type,
		MaxItems: 1,
	}));
	const record = response.ResourceRecordSets?.[0];
	if (record?.Name !== `${name}.` || record.Type !== type) return [];
	return record.ResourceRecords?.map((resourceRecord) => resourceRecord.Value || '').filter(Boolean) || [];
}

export async function upsertRoute53Records(hostedZoneId: string, records: Array<{ name: string; type: 'CNAME' | 'MX' | 'TXT'; ttl: number; values: string[] }>) {
	return getRoute53Client().send(new ChangeResourceRecordSetsCommand({
		HostedZoneId: hostedZoneId,
		ChangeBatch: {
			Changes: records.map((record) => ({
				Action: 'UPSERT',
				ResourceRecordSet: {
					Name: record.name,
					Type: record.type,
					TTL: record.ttl,
					ResourceRecords: record.values.map((Value) => ({ Value })),
				},
			})),
		},
	}));
}
