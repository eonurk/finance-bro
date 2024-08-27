import { Card } from "@/components/ui/card";

const CheckIcon = () => (
	<svg
		className="w-4 h-4 text-green-500 mr-2"
		fill="currentColor"
		viewBox="0 0 20 20"
	>
		<path
			fillRule="evenodd"
			d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
			clipRule="evenodd"
		/>
	</svg>
);

const PricingTable: React.FC = () => {
	const features = [
		"Access to all NASDAQ stocks",
		"Real-time market data",
		"Valuable insights with indicators",
		"Customizable indicator settings",
		"Advanced analytics dashboard",
		"Historical data analysis",
		"Early access to new features",
		"Priority email support",
	];

	return (
		<Card className="max-w-md mx-auto">
			<div className="p-8">
				<h2 className="text-xl font-medium mb-2 text-left">
					Indicator Insight Pro
				</h2>
				<div className="flex items-center mb-2">
					<span className="text-blue-500 bg-white border border-blue-500 text-xs px-2 py-0.5 rounded-full">
						Special Launch Offer
					</span>
				</div>
				<p className="text-sm font-light text-gray-400 mb-4 text-left">
					Access a wide range of technical indicators, and real-time market data
					from NASDAQ and much more.
				</p>
				<div className="flex items-end mb-4">
					<span className="text-lg line-through text-gray-500 mr-2">
						€12.99
					</span>
					<span className="text-4xl font-bold">€9.99</span>
					<span className="text-sm text-gray-500 ml-2 flex flex-col items-start leading-tight">
						<span>per</span>
						<br />
						<span>month</span>
					</span>
				</div>

				<button
					className="w-full bg-blue-600 text-white text-sm py-3 rounded-md hover:bg-blue-700 transition duration-300"
					onClick={() => {
						window.location.href = "https://buy.stripe.com/9AQg2M0Zy5Rq7Ic3cd";
					}}
				>
					Subscribe
				</button>

				<ul className="mt-4 space-y-2 text-sm">
					<p className="text-sm text-gray-600 mb-2 flex justify-start">
						This includes:
					</p>
					{features.map((feature, index) => (
						<li key={index} className="flex items-center">
							<CheckIcon />
							<span>{feature}</span>
						</li>
					))}
				</ul>
			</div>
		</Card>
	);
};

export default PricingTable;
