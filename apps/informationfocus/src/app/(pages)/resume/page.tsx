"use client";

import React from "react";
import { ResumeName, ResumeContact, ResumeEvents, ResumeSkills, ResumeSummary } from '@pixelated-tech/components';
import { PageSection, PageGridItem } from '@pixelated-tech/components';
import ResumeData from '@/app/data/resume.json';

export default function Home() {

	return (
		<PageSection columns={12} className="p-resume" id="resume-section">

			<PageGridItem columnStart={1} columnEnd={13} className="p-name">
				<div className="p-name">
					<ResumeName data={ResumeData.items[0].properties.name} />
				</div>
				<div className="p-contact">
					<ResumeContact title="Contact Information" data={ResumeData.items[0].properties.contact} />
				</div>
				<div className="p-education">
					<ResumeEvents title="Education" data={ResumeData.items[0].properties.education} />
				</div>
				<div className="p-skills">
					<ResumeSkills title="Skills" data={ResumeData.items[0].properties.skills} />
				</div>
				<div className="p-summary">
					<ResumeSummary title="Professional Summary" data={ResumeData.items[0].properties.summary} />
				</div>
				<div className="p-experience">
					<ResumeEvents title="Work History" data={ResumeData.items[0].properties.experience} dateFormat="yyyy" showDate />
				</div>
				<div className="p-certifications">
					<ResumeEvents title="Certifications" data={ResumeData.items[0].properties.certifications} />
				</div>
				<div className="p-volunteer">
					<ResumeEvents title="Volunteer Work" data={ResumeData.items[0].properties.volunteer} dateFormat="yyyy" showDate />
				</div>
			</PageGridItem>

		</PageSection>

	);
}
