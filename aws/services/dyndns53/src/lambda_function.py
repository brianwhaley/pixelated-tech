#!/usr/bin/env python
# -*- encoding: utf-8 -*-

from __future__ import print_function

import base64
import json
import logging
import re
import sys
from os import environ

import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def required_environment(name):
	value = environ.get(name)
	if not value:
		raise RuntimeError(f"{name} must be configured")
	return value


DDNS_USERNAME = required_environment("DYNDNS_USERNAME")
DDNS_PASSWORD = required_environment("DYNDNS_PASSWORD")


class AuthorizationMissing(Exception):
	status = 401
	response = {"WWW-Authenticate": "Basic realm=dyndns53"}


class HostnameException(Exception):
	status = 404
	response = "nohost"


class AuthorizationException(Exception):
	status = 403
	response = "badauth"


class FQDNException(Exception):
	status = 400
	response = "notfqdn"


class BadAgentException(Exception):
	status = 400
	response = "badagent"


class AbuseException(Exception):
	status = 403
	response = "abuse"


conf = {
	f"{DDNS_USERNAME}:{DDNS_PASSWORD}": {
		"hosts": {
			"home.pixelated.tech.": {
				"aws_region": "us-east-2",
				"zone_id": "Z3VWI30LVBBD2X",
				"record": {
					"ttl": 60,
					"type": "A",
				},
				"last_update": None,
			}
		}
	}
}


re_ip = re.compile(r"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$")


def _parse_ip(ipstring):
	match = re_ip.match(ipstring)
	if match and all(0 <= int(part) <= 255 for part in match.groups()):
		return ipstring
	raise BadAgentException("Invalid IP string: {}".format(ipstring))


client53 = boto3.client("route53", "us-east-2")


def r53_upsert(host, hostconf, ip):
	record_type = hostconf["record"]["type"]
	record_set = client53.list_resource_record_sets(
		HostedZoneId=hostconf["zone_id"],
		StartRecordName=host,
		StartRecordType=record_type,
		MaxItems="1",
	)

	old_ip = None
	if not record_set:
		logger.info("No existing record found for host %s in zone %s", host, hostconf["zone_id"])
	else:
		record = record_set["ResourceRecordSets"][0]
		if record["Name"] == host and record["Type"] == record_type:
			if len(record["ResourceRecords"]) == 1:
				old_ip = record["ResourceRecords"][0]["Value"]
			else:
				raise ValueError("Multiple existing records found for host {} in zone {}".format(host, hostconf["zone_id"]))
		else:
			logger.info("No existing record found for host %s in zone %s", host, hostconf["zone_id"])

	if old_ip == ip:
		logger.debug("Old IP same as new IP: %s", ip)
		return False

	logger.debug("Old IP was: %s", old_ip)
	client53.change_resource_record_sets(
		HostedZoneId=hostconf["zone_id"],
		ChangeBatch={
			"Changes": [{
				"Action": "UPSERT",
				"ResourceRecordSet": {
					"Name": host,
					"Type": record_type,
					"TTL": hostconf["record"]["ttl"],
					"ResourceRecords": [{"Value": ip}],
				},
			}],
		},
	)
	return True


def _handler(event, context):
	if "header" not in event:
		raise KeyError("Headers not populated properly. Check API Gateway configuration.")

	try:
		auth_header = event["header"]["Authorization"]
	except KeyError:
		raise AuthorizationMissing("Authorization required but not provided.")

	try:
		auth_user, auth_pass = base64.b64decode(auth_header[len("Basic "):].encode("ascii")).decode("ascii").split(":")
	except Exception:
		raise BadAgentException("Malformed basicauth string: {}".format(event["header"]["Authorization"]))

	if ":".join([auth_user, auth_pass]) not in conf:
		raise AuthorizationException("Bad username/password.")

	try:
		hosts = {host if host.endswith(".") else host + "." for host in event["querystring"]["hostname"].split(",")}
	except KeyError:
		raise BadAgentException("Hostname(s) required but not provided.")

	if any(host not in conf[":".join([auth_user, auth_pass])]["hosts"] for host in hosts):
		raise HostnameException()

	try:
		ip = _parse_ip(event["querystring"]["myip"])
		logger.debug("User supplied IP address: %s", ip)
	except KeyError:
		ip = _parse_ip(event["context"]["source-ip"])
		logger.debug("User omitted IP address, using best-guess from $context: %s", ip)

	auth_config = conf[":".join([auth_user, auth_pass])]["hosts"]
	if any(r53_upsert(host, auth_config[host], ip) for host in hosts):
		return "good {}".format(ip)
	return "nochg {}".format(ip)


def lambda_handler(event, context):
	try:
		response = _handler(event, context)
	except Exception as error:
		try:
			payload = {"status": error.status, "response": error.response, "additional": error.message}
		except AttributeError:
			payload = {"status": 500, "response": "911", "additional": str(error)}
		finally:
			raise type(error)(type(error)(json.dumps(payload)), sys.exc_info()[2])

	return {"status": 200, "response": response}
