import PropTypes, { InferProps } from "prop-types";
import { PageSectionHeader } from "@pixelated-tech/components";

Privacy.propTypes = {
	dataCaptureDetails: PropTypes.node,
};

export type PrivacyType = InferProps<typeof Privacy.propTypes>;

export default function Privacy({ dataCaptureDetails }: PrivacyType) {
	return (
		<>
			<PageSectionHeader title="Privacy Policy" />
			<div className="callout-body">
                All applications created by Pixelated Technologies are privacy respecting applications. We go out of our way to keep as little information about users as possible.<br/>
				<br/>
                As part of the onboarding, processing, and usage of our applications, we receive and store the minimum amount of personal information necessary.  {dataCaptureDetails}  Personal data will be collected directly from users if needed, and system data will be collected systematically through usage and events.  We store this information so long as you are using the application.  We delete it within 30 days of you uninstalling the app.<br/>
				<br/>
                This information is needed by the applications, or third party applications that are integrated, to be able to communicate with you.  We also keep a log of server traffic which makes note of the IP address of the requestor, what's being requested and user information if it is available. We record this information purely for troubleshooting and security analysis.  We keep the above log information for a maximum of 30 days and then delete it.<br/>
				<br/>
                Pixelated Technologies applications are a serverless applications that runs in a data center hosted by AWS in Ohio. We do not explicitly share anything with Amazon but they could have access to our systems if they chose to. We have no reason nor intention to transfer data outside the US.<br/>
				<br/>
                If you would like to find out more regarding your data or to access, transfer, or delete your data, please contact us at <a href="mailto:brian@pixelated.tech">brian@pixelated.tech</a>.
				<br/>
			</div>
		</>
	);
}