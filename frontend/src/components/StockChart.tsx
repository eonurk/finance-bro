import { useState, useEffect } from "react";
import { fetchStockData, getPercentChange } from "@/fetchStockData";
import { format } from "date-fns";
import { formatNumber } from "@/utils/formatting";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";

import { Checkbox } from "@/components/ui/checkbox";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { chartOptions } from "@/components/chartOptions";
import {
	CategoryScale,
	Chart as ChartJS,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeSeriesScale,
} from "chart.js";

import RMIChart from "@/components/RMIChart";
import RSIChart from "@/components/RSIChart";
import { stocks } from "@/utils/stocks";
import { User } from "firebase/auth"; // Import User type
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeSeriesScale
	// pulsingPlugin
);

const periodOptions = [
	{ value: "1d", label: "1 Day" },
	{ value: "1w", label: "1 Week" },
	{ value: "1m", label: "1 Month" },
	{ value: "3m", label: "3 Months" },
	{ value: "ytd", label: "Year to Date" },
	{ value: "1y", label: "1 Year" },
	{ value: "all", label: "All" },
];

interface StockChartProps {
	user: User | null; // Use User type from firebase/auth
}

function StockChart({ user }: StockChartProps) {
	const [period, setPeriod] = useState<string>("1w");
	const [symbol, setSymbol] = useState<string>("AAPL");
	const [stockInfo, setStockInfo] = useState<{
		symbol: string;
		period: string;
		volume: string;
		avgVolume: string;
		marketCap: string;
		week52High: number;
		week52Low: number;
		peRatio: number;
		currentPrice: string | undefined;
		priceChangePercentage: string;
		lineColor: string;
		cardTitleColor: string;
		chartOptions: any;
		formattedData: any;
	} | null>(null);

	// indicators
	const [showRMI, setShowRMI] = useState<boolean>(true);
	const [showRSI, setShowRSI] = useState<boolean>(false);

	// Define a list of restricted stocks for non-logged-in users
	const availableStocks = user
		? stocks
		: {
				AAPL: "Apple Inc.",
				ABNB: "Airbnb, Inc.",
				AMZN: "Amazon.com, Inc.",
				EBAY: "eBay Inc.",
				GOOGL: "Alphabet Inc. (Class A)",
				META: "Meta Platforms, Inc.",
				NFLX: "Netflix, Inc.",
				PLTR: "Palantir Technologies Inc.",
				ZM: "Zoom Video Communications, Inc.",
		  };

	const getStockInfo = async (symbol: string, period: string) => {
		try {
			const fetchedData = await fetchStockData(symbol, period);
			const stockData = fetchedData[symbol];
			if (!stockData) {
				console.error("No data found for symbol:", symbol);
				return;
			}
			// for now fetch only one symbol
			const history = stockData["history"];
			const dates = Object.keys(history).map((date) => new Date(date));
			const closingPrices = dates
				.map((date) => history[format(date, "yyyy-MM-dd HH:mm:ss")]?.Close)
				.filter((price) => price !== undefined) as number[];

			const latestPrice = closingPrices[closingPrices.length - 1];
			const priceChangePercentage = getPercentChange(closingPrices);
			const lineColor = priceChangePercentage < 0 ? "red" : "#19e64d";
			const cardTitleColor =
				priceChangePercentage < 0 ? "text-red-500" : "text-green-500";

			let customChartOptions = chartOptions(period);
			customChartOptions = {
				...customChartOptions, // Correct spread syntax to copy existing options
			};

			setStockInfo({
				symbol,
				period,
				volume: formatNumber(stockData["volume"]),
				avgVolume: formatNumber(stockData["avgVolume"]),
				marketCap: formatNumber(stockData["marketCap"]),
				week52High: stockData["week52High"],
				week52Low: stockData["week52Low"],
				peRatio: stockData["peRatio"],
				currentPrice: latestPrice ? latestPrice.toFixed(2) : undefined,
				priceChangePercentage: priceChangePercentage.toFixed(2),
				lineColor: lineColor,
				cardTitleColor: cardTitleColor,
				formattedData: {
					labels: dates,
					datasets: [
						{
							label: symbol,
							data: closingPrices.map((price, index) => ({
								x: dates[index],
								y: price,
							})),
							borderColor: lineColor,
							borderWidth: 2,
							backgroundColor: lineColor,
							fill: false,
							tension: 0.1,
						},
					],
				},
				chartOptions: customChartOptions,
			});
		} catch (error) {
			console.error("Error fetching stock info:", error);
			if (error instanceof TypeError) {
				console.error("Network error:", error.message);
			}
		}
	};

	useEffect(() => {
		// Initial fetch when the component mounts
		getStockInfo(symbol, period);

		// Set up the interval to refresh the chart every 60 seconds
		const intervalId = setInterval(() => {
			getStockInfo(symbol, period);
		}, 60000); // 600ms = 60 seconds

		// Cleanup the interval on component unmount
		return () => clearInterval(intervalId);
	}, [symbol, period, showRMI, showRSI]); // Dependencies ensure the effect runs again if symbol or period change

	return (
		<Card>
			<CardHeader className="items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
				<div className="flex-1 gap-1 text-center sm:text-left">
					<CardTitle>{stockInfo?.symbol}</CardTitle>
					<CardDescription className={stockInfo?.cardTitleColor}>
						${stockInfo?.currentPrice} ({stockInfo?.priceChangePercentage}%)
						<div className="flex gap-4">
							<div className="grid text-slate-400">
								<p>Volume: {stockInfo?.volume}</p>
								<p>Avg Volume: {stockInfo?.avgVolume}</p>
								<p>Market Cap: {stockInfo?.marketCap}</p>
							</div>
							<div className="grid text-slate-400">
								<p>P/E ratio: {stockInfo?.peRatio.toFixed(2)}</p>
								<p>52 Wk Low: {stockInfo?.week52Low.toFixed(2)}</p>
								<p>52 Wk High: {stockInfo?.week52High.toFixed(2)}</p>
							</div>
						</div>
					</CardDescription>
				</div>

				<div className="flex gap-2">
					<Select value={symbol} onValueChange={setSymbol}>
						<SelectTrigger
							className="flex min-w-32 rounded-lg sm:ml-auto"
							aria-label="Select a value"
						>
							<SelectValue placeholder="AAPL" />
						</SelectTrigger>
						<SelectContent position="popper">
							{Object.entries(availableStocks).map(([id, name]) => (
								<SelectItem key={id} value={id}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={period} onValueChange={setPeriod}>
						<SelectTrigger
							className="flex min-w-32 rounded-lg sm:ml-auto"
							aria-label="Select a value"
						>
							<SelectValue placeholder="1w" />
						</SelectTrigger>
						<SelectContent position="popper">
							{periodOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex gap-2">
					<Checkbox
						id="RMI"
						checked={showRMI}
						onCheckedChange={() => setShowRMI((prev) => !prev)}
					/>
					<label
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						htmlFor="RMI"
					>
						RMI
					</label>

					<Checkbox
						id="RSI"
						checked={showRSI}
						onCheckedChange={() => setShowRSI((prev) => !prev)}
					/>

					<div className="grid gap-1.5 leading-none">
						<label
							htmlFor="RSI"
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							RSI
						</label>
					</div>
				</div>
			</CardHeader>
			<CardContent className="">
				<br />
				{stockInfo && (
					<>
						<Line
							data={stockInfo.formattedData}
							options={stockInfo.chartOptions}
						/>

						{showRMI && (
							<RMIChart
								formattedData={stockInfo.formattedData}
								RMIperiod={14}
								options={stockInfo.chartOptions}
							/>
						)}
						{showRSI && (
							<RSIChart
								formattedData={stockInfo.formattedData}
								RSIperiod={14} // [TODO]: Allow users to select indicator periods
								options={stockInfo.chartOptions}
							/>
						)}
					</>
				)}
			</CardContent>
			<CardFooter></CardFooter>
		</Card>
	);
}

export default StockChart;
