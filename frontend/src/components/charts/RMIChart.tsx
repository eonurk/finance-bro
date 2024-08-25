import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { RMI } from "@/utils/Indicators";
import {
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
interface DataPoint {
	x: Date;
	y: number;
}

interface Dataset {
	label: string;
	data: DataPoint[];
	borderColor: string;
	borderWidth: number;
	backgroundColor: string;
	fill: boolean;
	tension: number;
}

interface RMIChartProps {
	formattedData: {
		labels: Date[];
		datasets: Dataset[];
	};
	period?: number;
	options?: any;
}

// Calculate profit based on RSI with buy/sell signals
export function calculateRMIProfit(prices: any[], rmiData: string | any[]) {
	let capital = 100; // Start with an initial capital (can be any arbitrary value)
	let latestBuyPrice = null;
	let latestSellPrice = null;
	const buyPoints = [];
	const sellPoints = [];

	for (let i = 1; i < rmiData.length; i++) {
		// Buy signal: RSI crosses above 30
		if (rmiData[i - 1] < 30 && rmiData[i] > 30 && rmiData[i - 1] != null) {
			latestBuyPrice = prices[i];
			buyPoints.push({ x: i, y: rmiData[i], price: prices[i] });
		}
		// Sell signal: RSI crosses below 70
		else if (
			rmiData[i - 1] > 70 &&
			rmiData[i] < 70 &&
			latestBuyPrice !== null
		) {
			// Calculate profit/loss for this trade and update capital
			capital = capital * (1 + (prices[i] - latestBuyPrice) / latestBuyPrice);
			sellPoints.push({ x: i, y: rmiData[i], price: prices[i] });
			latestBuyPrice = null; // Reset after tracking the latest sell
			latestSellPrice = prices[i];
		}
	}

	// If there's an open position at the end, close it using the last price
	if (latestBuyPrice !== null) {
		capital =
			capital *
			(1 + (prices[prices.length - 1] - latestBuyPrice) / latestBuyPrice);
	}

	// Compound profit/loss is the difference between the final capital and initial capital
	const profit = capital - 100;

	return { profit, buyPoints, sellPoints, latestBuyPrice, latestSellPrice };
}

export default function RMIChart({
	formattedData,
	period = 14,
	options = {},
}: RMIChartProps) {
	const rmiData = useMemo(() => {
		if (
			!formattedData ||
			!formattedData.datasets ||
			formattedData.datasets.length === 0
		) {
			console.error("Invalid data structure provided to RMIChart");
			return null;
		}

		const prices = formattedData.datasets[0].data.map((point) => point.y);
		const rmi = RMI(prices, period);
		return rmi;
	}, [formattedData, period]);

	if (!rmiData) return null;

	const prices = formattedData.datasets[0].data.map((point) => point.y);
	// Calculate profit and buy/sell points
	const { profit, buyPoints, sellPoints } = useMemo(() => {
		return calculateRMIProfit(prices, rmiData);
	}, [prices, rmiData]);

	const chartData = {
		labels: formattedData.labels,
		datasets: [
			{
				label: "Buy Points",
				data: buyPoints.map((point) => ({
					x: formattedData.labels[point.x],
					y: point.y,
				})),
				backgroundColor: "#22c55e",
				borderColor: "#22c55e",
				pointRadius: 5,
				showLine: false,
			},
			{
				label: "Sell Points",
				data: sellPoints.map((point) => ({
					x: formattedData.labels[point.x],
					y: point.y,
				})),
				backgroundColor: "red",
				borderColor: "red",
				pointRadius: 5,
				showLine: false,
			},
			{
				label: "RMI",
				data: rmiData.map((value, index) => ({
					x: formattedData.labels[index],
					y: value,
				})),
				borderColor: "darkblue",
				borderWidth: 2,
				backgroundColor: "rgba(0, 255, 0, 0.1)",
				fill: false,
			},
		],
	};

	const customOptions = {
		...options,
		scales: {
			...options.scales,
			y: {
				suggestedMin: 0,
				suggestedMax: 100,
			},
		},
	};

	return (
		<>
			<CardHeader className="flex items-center gap-2 space-y-0 py-5 sm:flex-row">
				<div className="grid flex-1 gap-1 text-center sm:text-left">
					<CardTitle className="text-xl">RMI({period})</CardTitle>
					<CardDescription
						className={`${
							profit > 0 ? "text-base text-green-500" : "text-base text-red-500"
						}`}
					>
						Potential Profit: {profit.toFixed(2)}%
					</CardDescription>
				</div>
			</CardHeader>
			<Line data={chartData} options={customOptions} />
			<br />
			<CardFooter className="text-left text-sm text-slate-400">
				RMI 30/70 was calculated for all indicator points. <br />
				Sum of the potential cumulative profit/loss was reported as Total
				Profit.
			</CardFooter>
		</>
	);
}
