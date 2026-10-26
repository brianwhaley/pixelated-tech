// https://www.azaytek.com/cors-aws-lambda-api-gateway-proxy-tutorial/

import fetch from "node-fetch";

const debug = false;
const UPSTREAM_FETCH_TIMEOUT_MS = 8_000;

const getRequestDiagnostics = (event, url) => {
	let targetHost = 'unknown';
	try {
		targetHost = new URL(url).hostname;
	} catch {
		targetHost = 'invalid';
	}
	return {
		requestId: event?.requestContext?.requestId,
		method: event?.httpMethod,
		targetHost
	};
};

export const handler = async (event) => {
	/* if(event.requestContext.httpMethod != 'GET'){
        return returnResponse({error: true, message: 'Method not allowed!'});
    } else */
	const queryStringParameters = event?.queryStringParameters ?? {};
	const targetUrl = queryStringParameters.url;
	if (typeof targetUrl !== "string" || targetUrl.trim() === "") {
		return returnResponse(JSON.stringify({error: true, message: "A URL query parameter is required."}), 400);
	}
	try {
		new URL(targetUrl);
	} catch {
		return returnResponse(JSON.stringify({error: true, message: "The URL query parameter is invalid."}), 400);
	}
	const upstreamResponse = await getResponse(event);
	return returnResponse(upstreamResponse.body, upstreamResponse.statusCode);
	// return returnResponse(event.queryStringParameters) ;
	// callback(null, response);
};

let responseContentType = 'application/json';

const getResponse = async function (event) {

	if ( debug ) console.log("EVENT OBJECT : " , event);

	let url = event.queryStringParameters.url;
	for (const key in event.queryStringParameters) {
		if (Object.prototype.hasOwnProperty.call(event.queryStringParameters, key)) { // Check if the property belongs to the object itself
			const value = event.queryStringParameters[key];
			if (key != 'url') url += `&${key}=${value}` ;
		}
	}
	if(url == undefined){ url = ''; }

	let responseBody = null;
	let responseStatusCode = 502;
    
	const myHeaders = { ...event.headers } ;
	// myHeaders.accept = '*/*'; 
	// myHeaders["accept-language"] = "*";
	myHeaders["cache-control"] = "no-cache";
	myHeaders.pragma = "no-cache";
	// myHeaders["sec-fetch-dest"] = "empty";
	// myHeaders["sec-fetch-mode"] = "cors";
	// myHeaders["sec-fetch-site"] = "same-origin";
	// myHeaders["x-requested-with"] = "XMLHttpRequest, XMLHttpRequest";
	// "referrerPolicy": "strict-origin-when-cross-origin",
	delete myHeaders.Host;
	delete myHeaders.origin;
	delete myHeaders.referer;
	delete myHeaders['X-Forwarded-For'];
	delete myHeaders['X-Forwarded-Port'];
	delete myHeaders['X-Forwarded-Proto'];

	if ( debug ) console.log("MY NEW HEADERS : ", myHeaders);
	try {
		console.log('FETCHING URL via ', event.httpMethod, ' : ', url);
		const response = await fetch(url, {
			method: event.httpMethod,
			headers: myHeaders,
			mode: 'cors',
			body: (event.body) ? event.body : null,
			signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS)
		});
		responseStatusCode = response.status;
		if (!response.ok) {
			const responseDetails = {
				...getRequestDiagnostics(event, url),
				status: response.status,
				statusText: response.statusText
			};
			if (response.status >= 400 && response.status < 500) {
				console.warn('Proxy upstream response was not successful', responseDetails);
			} else {
				console.error('Proxy upstream response was not successful', responseDetails);
			}
		}
		// responseBody = await response.text();

		if ( debug ) console.log("RESPONSE : " , response);

		const contentType = response.headers.get('content-type');
		if (contentType) {
			responseContentType = contentType;
			if (contentType.includes('application/json')) {
				responseBody = await response.json();
				responseBody = JSON.stringify(responseBody);
			} else if (contentType.includes('image/')) {
				responseBody = await response.blob();
			} else {
				// HTML, XML, PLAIN
				responseBody = await response.text();
			}
		} else {
			console.error('Proxy upstream response is missing Content-Type', getRequestDiagnostics(event, url));
		}
	} catch (e) {
		const isTimeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
		responseStatusCode = isTimeout ? 504 : 502;
		console.error('Proxy upstream fetch failed', {
			...getRequestDiagnostics(event, url),
			isTimeout,
			errorName: e?.name,
			errorMessage: e?.message
		});
		responseBody = JSON.stringify({
			error: true,
			message: isTimeout ? 'The upstream request timed out.' : (e?.message || 'Upstream fetch failed.')
		});
	}
	if ( debug ) console.log('RESPONSE BODY : ', responseContentType, " : ", responseBody);
	return {body: responseBody, statusCode: responseStatusCode};
};

const returnResponse = async function (responseBody, statusCode = 200) {
	if (typeof responseBody !== 'string') {
		console.error('Proxy response body is not API Gateway compatible', {
			bodyType: responseBody === null ? 'null' : typeof responseBody,
			contentType: responseContentType,
			statusCode
		});
	}
	const response = {
		"isBase64Encoded": false,
		"statusCode": statusCode,
		"headers": {
			"Content-Type": responseContentType,
			"Access-Control-Allow-Credentials": true ,
			"Access-Control-Allow-Headers": "*",
			"Access-Control-Allow-Methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Expose-Headers": "*, Authorization, Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified, Pragma, X-Amz-Date, X-Amz-Security-Token, X-Api-Key"
		},
		"body": responseBody,
	};
	if (debug) console.log("MY RESPONSE : ", response);
	return (response);
};

