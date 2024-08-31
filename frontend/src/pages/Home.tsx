import StockChart from "@/components/charts/StockChart";
import IndicatorChecker from "@/components/charts/IndicatorChecker";
import { User } from "firebase/auth"; // Import User type
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FAQHome from "@/components/FAQHome";
import PricingTable from "@/components/PricingTable";
import NotificationBoard from "@/components/charts/NotificationBoard";
import { useState, useEffect } from "react";
import UMAPChart from "@/components/charts/UMAP-Chart";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getAvailableIndices,
	getCompaniesByIndex,
	getDefaultCompanies,
} from "@/utils/marketData";
import { Label } from "@/components/ui/label";
import { stocks } from "@/utils/stocks";

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
		RSI: false,
		EMA: false,
		MACD: false,
		Bollinger: false,
	});

	const [selectedIndex, setSelectedIndex] = useState("S&P 100");
	const [availableIndices, setAvailableIndices] = useState<string[]>([]);
	const [availableStocks, setAvailableStocks] = useState<
		Record<string, string>
	>({});

	// Add this function at the top of your component or in a separate utils file
	function areArraysEqual(arr1: string[], arr2: string[]): boolean {
		if (arr1.length !== arr2.length) return false;
		return arr1.every((value, index) => value === arr2[index]);
	}

	useEffect(() => {
		const fetchData = async () => {
			if (!user) {
				// If user is not logged in, use default companies
				const defaultStocks = getDefaultCompanies();
				if (
					!areArraysEqual(
						Object.keys(availableStocks),
						Object.keys(defaultStocks)
					)
				) {
					setAvailableStocks(defaultStocks);
					if (!Object.keys(defaultStocks).includes(selectedStock)) {
						setSelectedStock(Object.keys(defaultStocks)[0]);
					}
				}
			} else {
				// Fetch available indices if not already loaded
				if (availableIndices.length === 0) {
					const indices = await getAvailableIndices();
					setAvailableIndices(indices);
				}
				// Fetch stocks for the selected index
				const stocks = await getCompaniesByIndex(selectedIndex);
				setAvailableStocks(stocks);

				// Update selectedStock if it's not in the new list
				if (!stocks[selectedStock]) {
					setSelectedStock(Object.keys(stocks)[0]);
				}
			}
		};

		fetchData();
	}, [user, selectedIndex, availableIndices.length, selectedStock]);

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
			{!user && <HeroSection />}

			<div className="container mx-auto px-0">
				{user && (
					<div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg shadow-md flex flex-col items-center">
						<Label className="text-white text-lg font-semibold">
							Select an index
						</Label>
						<p className="text-white text-xs mb-2">
							As a Pro user, you have access to multiple stock indices.
						</p>
						<Select value={selectedIndex} onValueChange={setSelectedIndex}>
							<SelectTrigger className="w-[200px] bg-white text-gray-800">
								<SelectValue placeholder="Select an index" />
							</SelectTrigger>
							<SelectContent>
								{availableIndices.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-white opacity-80 text-center">
							<br />
							<span className="inline-flex items-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 mr-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span className="text-white text-xs opacity-80 ">
									Only the stocks of the selected index are shown. It might take
									a few seconds to load.
								</span>
							</span>
						</p>
					</div>
				)}

				{!user && (
					<section
						className="mt-[10em] text-center"
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

				<section id="notification-board" className="pb-20 pt-10">
					<NotificationBoard
						onNotificationClick={(stock, period, indicator) => {
							handleNotificationClick(stock, period, indicator);
							handleScroll("stock-chart");
						}}
						availableStocks={availableStocks}
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

				<section id="stock-chart" className="pb-20 pt-10">
					<StockChart
						selectedStock={selectedStock}
						selectedPeriod={selectedPeriod}
						selectedIndicators={selectedIndicators}
						availableStocks={availableStocks}
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
						<div className="flex pb-10">
							<PricingTable />
						</div>
					</section>
				)}

				{!user && <FAQHome />}

				<SiteFooter />
			</div>
		</>
	);
}

export default Home;
