import Header from '@/app/elements/header';
import Footer from '@/app/elements/footer';

export default function PagesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<>
			<header><Header /></header>
			<main>{children}</main>
			<footer><Footer /></footer>
		</>
	);
}
