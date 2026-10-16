import nodemailer from "nodemailer";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const debug = false;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpUser || !smtpPassword) {
	throw new Error("SMTP_USER and SMTP_PASSWORD must be configured");
}

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: smtpUser,
		pass: smtpPassword
	}
});

const lambdaClient = new LambdaClient({});

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

		const domain = body?.domain ?? "pixelated.tech";
		const formName = body?.formName ?? "contact-form";

		try {
			if (debug) console.log("Invoking formSubmit2DB for storage");
			const dbParams = {
				FunctionName: "formSubmit2DB",
				InvocationType: "Event",
				Payload: JSON.stringify({ domain, formName, formData: body })
			};
			lambdaClient.send(new InvokeCommand(dbParams)).catch((dbError) => {
				console.error("Async DB invoke failed:", dbError);
			});
		} catch (dbError) {
			console.error("Error invoking formSubmit2DB:", dbError);
		}

		let bodyText = "<h2>Form Details</h2>";
		for (const key in body) {
			const label = key.replace("_", " ");
			const formattedLabel = label
				.toLowerCase()
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.substring(1))
				.join(" ");
			bodyText += `<p><strong>${formattedLabel} : </strong>${body[key]}</p>`;
		}

		const mailOptions = {
			from: body.from ?? smtpUser,
			to: body.to ?? smtpUser,
			subject: body.subject ?? "Pixelated SendMail",
			html: bodyText
		};

		const info = await transporter.sendMail(mailOptions);
		if (debug) console.log("Message sent:", info.messageId);

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
