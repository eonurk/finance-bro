import StockChart from "@/components/charts/StockChart";
import IndicatorChecker from "@/components/charts/BacktestAll";
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
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
		SMA: true,
		EMA: true,
		MACD: true,
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
				// Fetch stocks for the selected index only if they've changed
				const stocks = await getCompaniesByIndex(selectedIndex);
				if (
					!areArraysEqual(Object.keys(availableStocks), Object.keys(stocks))
				) {
					setAvailableStocks(stocks);
					// Update selectedStock if it's not in the new list
					if (!stocks[selectedStock]) {
						setSelectedStock(Object.keys(stocks)[0]);
					}
				}
			}
		};

		fetchData();
	}, [user, selectedIndex, availableIndices.length]);

	const handleNotificationClick = (
		stock: string,
		period: string,
		indicator: string
	) => {
		setSelectedStock(stock);
		setSelectedPeriod(period);
		setSelectedIndicators({
			RMI: indicator === "RMI",
			RSI: indicator === "RSI",
			SMA: indicator === "SMA",
			EMA: indicator === "EMA",
			MACD: indicator === "MACD",
			Bollinger: indicator === "Bollinger",
		});
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
									className="w-4 h-4 text-slate-500 z-0"
									fill="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M12 2L2 22h20L12 2z" />
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

				<section id="notification-board" className="pb-10 pt-10 relative">
					<NotificationBoard
						onNotificationClick={(stock, period, indicator) => {
							handleNotificationClick(stock, period, indicator);
							handleScroll("stock-chart");
						}}
						availableStocks={availableStocks}
					/>
					{!user && (
						<div className="relative sm:w-2/3 h-full max-w-screen-xl mx-auto">
							<p className="z-10 text-sm font-xs text-gray-100 px-1 py-1 bg-gray-400 rounded transition-all duration-300">
								Click on an insight to explore more
							</p>
						</div>
					)}
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

				{!user && (
					<div className="text-center">
						<div className="relative flex justify-center text-sm uppercase mb-4">
							<span className="bg-background px-2 text-muted-foreground">
								Or
							</span>
						</div>
						<Link
							to="https://t.me/iisight"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block"
						>
							<Button
								variant="outline"
								className="text-blue-600 hover:bg-blue-100 transition-colors duration-300 py-6 px-6 text-lg font-semibold  shadow-sm flex items-center space-x-4"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 496 512"
									width="36"
									height="36"
									fill="currentColor"
								>
									<path d="M248 8C111 8 0 119 0 256S111 504 248 504 496 393 496 256 385 8 248 8zM363 176.7c-3.7 39.2-19.9 134.4-28.1 178.3-3.5 18.6-10.3 24.8-16.9 25.4-14.4 1.3-25.3-9.5-39.3-18.7-21.8-14.3-34.2-23.2-55.3-37.2-24.5-16.1-8.6-25 5.3-39.5 3.7-3.8 67.1-61.5 68.3-66.7 .2-.7 .3-3.1-1.2-4.4s-3.6-.8-5.1-.5q-3.3 .7-104.6 69.1-14.8 10.2-26.9 9.9c-8.9-.2-25.9-5-38.6-9.1-15.5-5-27.9-7.7-26.8-16.3q.8-6.7 18.5-13.7 108.4-47.2 144.6-62.3c68.9-28.6 83.2-33.6 92.5-33.8 2.1 0 6.6 .5 9.6 2.9a10.5 10.5 0 0 1 3.5 6.7A43.8 43.8 0 0 1 363 176.7z" />
								</svg>
								<span>Join our Telegram for Daily Financial Tips</span>
							</Button>
						</Link>
					</div>
				)}
				{!user && <FAQHome />}

				<SiteFooter />
			</div>
		</>
	);
}

export default Home;
