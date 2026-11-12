export type TimesheetRole = 'user' | 'admin';

export type TimesheetUser = {
	domain: string;
	email: string;
	name?: string;
	company?: string;
	role: TimesheetRole;
	passcode?: string;
	passcodeExpires?: string;
	sessionToken?: string;
	sessionExpires?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type TimesheetRecord = {
	domain: string;
	id: string;
	email: string;
	weekOf: string;
	sunDate: string;
	monDate: string;
	tueDate: string;
	wedDate: string;
	thuDate: string;
	friDate: string;
	satDate: string;
	sun: string;
	mon: string;
	tue: string;
	wed: string;
	thu: string;
	fri: string;
	sat: string;
	totalHours: string;
	createdAt: string;
	updatedAt: string;
};

export type TimesheetHours = {
	sun: string;
	mon: string;
	tue: string;
	wed: string;
	thu: string;
	fri: string;
	sat: string;
};
