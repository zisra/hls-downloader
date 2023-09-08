import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div
			className="flex flex-col justify-center items-center py-5 px-5"
			style={{
				minHeight: '91vh',
			}}
		>
			{children}
		</div>
	);
}
