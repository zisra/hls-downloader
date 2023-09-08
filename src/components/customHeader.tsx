import { TextField } from '@mui/material';
import { useState, type Dispatch } from 'react';
import { toast } from 'react-hot-toast';

export default function RendercustomHeaders({
	setCustomHeaders,
	customHeaders,
}: {
	setCustomHeaders: Dispatch<React.SetStateAction<Record<string, string>>>;
	customHeaders: Record<string, string>;
}) {
	const [key, setkey] = useState('');
	const [value, setvalue] = useState('');

	function addCustomHeader() {
		if (!key || !value) {
			toast.error(`Key or value is empty`);
			return;
		}
		setCustomHeaders((prev) => {
			return {
				...prev,
				[key]: value,
			};
		});
		setkey('');
		setvalue('');
	}

	function removeCustomHeader(key: string) {
		setCustomHeaders((prev) => {
			const newcustomHeaders = { ...prev };
			delete newcustomHeaders[key];
			return newcustomHeaders;
		});
	}

	return (
		<>
			<div className="flex flex-col w-full">
				<div className="flex w-full gap-2 mt-2">
					<div className="w-4/12">
						<TextField
							fullWidth
							label="Key"
							value={key}
							onChange={(e) => setkey(e.target.value)}
							size="small"
						/>
					</div>

					<div className="w-6/12">
						<TextField
							fullWidth
							label="Value"
							value={value}
							onChange={(e) => setvalue(e.target.value)}
							size="small"
						/>
					</div>

					<button
						className="bg-gray-900 hover:bg-gray-700 text-white px-2 py-1 rounded-md w-2/12"
						onClick={addCustomHeader}
					>
						Add
					</button>
				</div>
				<div className="flex flex-col mt-5">
					{Object.keys(customHeaders).map((key, i) => (
						<div
							className="flex flex-row justify-between items-center mt-2"
							key={key}
						>
							<div className="flex flex-row items-center">
								<span className="mr-2 font-medium">{key}:</span>
								<span className="mr-2">{customHeaders[key]}</span>
							</div>
							<button
								className="text-red-500"
								onClick={() => removeCustomHeader(key)}
							>
								Remove
							</button>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
