import StockChart from "@/components/charts/StockChart";
import IndicatorChecker from "@/components/charts/IndicatorChecker";
import { User } from "firebase/auth"; // Import User type
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/Footer";
import PricingTable from "@/components/PricingTable";
import NotificationBoard from "@/components/NotificationBoard";
import { useState } from "react";
import UMAPChart from "@/components/charts/UMAP-Chart";
<script async src="https://js.stripe.com/v3/pricing-table.js"></script>;
interface StockChartProps {
	user: User | null; // Use User type from firebase/auth
}

const handleScroll = (target: string) => {
	// Using `document.getElementById` to find the scroll target
	const section = document.getElementById(target);
	if (section) {
		// Scroll smoothly to the target section
		section.scrollIntoView({ behavior: "smooth" });
	}
};

export function Home({ user }: StockChartProps) {
	const [selectedStock, setSelectedStock] = useState("AAPL");
	const [selectedPeriod, setSelectedPeriod] = useState("1m");
	const [selectedIndicators, setSelectedIndicators] = useState({
		RMI: true,
		RSI: true,
		EMA: true,
		MACD: true,
		Bollinger: true,
	});

	const handleNotificationClick = (
		stock: string,
		period: string,
		indicator: string
	) => {
		setSelectedStock(stock);
		setSelectedPeriod(period);
		setSelectedIndicators((prev) => ({
			...Object.fromEntries(Object.keys(prev).map((key) => [key, false])),
			[indicator]: true,
		}));
	};

	return (
		<>
			<SiteHeader />

			<div className="container mx-auto px-0">
				{!user && (
					<section
						className="pt-20 text-center"
						onClick={() => handleScroll("notification-board")}
					>
						<h2 className="text-2xl font-normal text-neutral-600 dark:text-neutral-400">
							Get real-time insights with your favorite indicator
						</h2>
						<div className="text-4xl motion-safe:animate-bounce mt-4">
							&#8964;
						</div>
					</section>
				)}

				<section
					id="notification-board"
					className="pb-20 pt-10 "
					onClick={() => handleScroll("stock-chart")}
				>
					<NotificationBoard
						user={user}
						onNotificationClick={handleNotificationClick}
					/>
				</section>

				{!user && (
					<section className="pt-20 text-center">
						<h2 className="text-2xl md:w-2/3 mx-auto font-normal text-neutral-600 dark:text-neutral-400">
							Analyze stock performance with powerful indicators to spot
							<span className="text-green-500">
								{" "}
								profitable opportunities
							</span>{" "}
							and
							<span className="text-red-500"> potential risks</span>
						</h2>
						<div className="text-4xl motion-safe:animate-bounce mt-4">
							&#8964;
						</div>
					</section>
				)}

				<section id="stock-chart" className="pb-20 pt-10 ">
					<StockChart
						user={user}
						selectedStock={selectedStock}
						selectedPeriod={selectedPeriod}
						selectedIndicators={selectedIndicators}
					/>
				</section>

				{!user && (
					<section className="pt-20 text-center">
						<h2 className="text-2xl font-normal text-neutral-600 dark:text-neutral-400">
							Check an indicator for all stocks
						</h2>
						<div className="text-4xl motion-safe:animate-bounce mt-4">
							&#8964;
						</div>
					</section>
				)}

				<section className="pb-20 pt-10 ">
					<IndicatorChecker user={user} />
				</section>

				{!user && (
					<section
						className="pt-20 text-center"
						onClick={() => handleScroll("umap-board")}
					>
						<h2 className="text-2xl font-normal text-neutral-600 dark:text-neutral-400">
							Visualize the entire market at a glance <br />
							<span className="text-blue-500 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full text-xs font-semibold inline-block align-middle mt-2">
								NEW
							</span>
						</h2>
						<div className="text-4xl motion-safe:animate-bounce mt-4">
							&#8964;
						</div>
					</section>
				)}

				<section id="umap-board" className="pb-20 pt-10 ">
					<UMAPChart user={user} />
				</section>

				{!user && (
					<section className="pt-20 text-center">
						<h2 className="text-2xl font-normal text-neutral-600 dark:text-neutral-400 mb-4">
							Get access to more indicators and features
						</h2>
						<div className="text-4xl motion-safe:animate-bounce mb-8">
							&#8964;
						</div>
						<div className="flex pb-20">
							<PricingTable />
						</div>
					</section>
				)}
			</div>

			<SiteFooter />
		</>
	);
}

export default Home;
