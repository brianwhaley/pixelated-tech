import { getSesMessageBody, sendEmail } from "./mail-transport.mjs";

const platformSender = "info@pixelated.tech";

export { getSesMessageBody };

export const getMailOptions = (body) => ({
	from: platformSender,
	to: String(body?.to ?? "").trim() || platformSender,
	subject: String(body?.subject ?? "Pixelated SendMail"),
	html: String(body?.html ?? ""),
	text: String(body?.text ?? body?.html ?? "")
});

export const handler = async (event) => {
	try {
		const body = event.body
			? typeof event.body === "string"
				? JSON.parse(event.body)
				: event.body
			: {};

		if (Object.keys(body).length === 0) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: "Bad Request: Request body cannot be empty." }),
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST"
				}
			};
		}

		const info = await sendEmail(getMailOptions(body));

		return {
			statusCode: 200,
			body: JSON.stringify({ message: "success", messageId: info.messageId }),
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST"
			}
		};
	} catch (error) {
		console.error("sendmail lambda error:", error);
		return {
			statusCode: 502,
			body: JSON.stringify({ message: "Internal server error", error: error.message }),
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST"
			}
		};
	}
};
