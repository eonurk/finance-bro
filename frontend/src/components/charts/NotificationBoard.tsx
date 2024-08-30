import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "@/components/ui/card";
import { fetchStockData } from "@/fetchStockData";
import { RMI, RSI, MACD } from "@/utils/Indicators";
import { format } from "date-fns";
import { calculateRMIProfit } from "@/components/charts/RMIChart";
import { calculateRSIProfit } from "@/components/charts/RSIChart";
import { calculateMACDProfit } from "@/components/charts/MACD-Chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Notification {
	id: string;
	stock: string;
	indicator: string;
	signal: "buy" | "sell";
	price: number;
	timestamp: Date;
	isNew: boolean;
}

const periodOptions = [
	{ value: "1d", label: "1 Day" },
	{ value: "1w", label: "1 Week" },
	{ value: "1m", label: "1 Month" },
	{ value: "3m", label: "3 Months" },
	{ value: "ytd", label: "Year to Date" },
	{ value: "1y", label: "1 Year" },
	{ value: "all", label: "All" },
];

const indicators = [
	{
		key: "RMI",
		label: "RMI",
		calculate: RMI,
		calculateProfit: calculateRMIProfit,
	},
	{
		key: "RSI",
		label: "RSI",
		calculate: RSI,
		calculateProfit: calculateRSIProfit,
	},
	{
		key: "MACD",
		label: "MACD",
		calculate: MACD,
		calculateProfit: calculateMACDProfit,
	},
];

interface NotificationBoardProps {
	availableStocks: { [key: string]: string };
	onNotificationClick: (
		stock: string,
		period: string,
		indicator: string
	) => void;
}

const NotificationBoard: React.FC<NotificationBoardProps> = ({
	onNotificationClick,
	availableStocks,
}) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(new Date());
	const [selectedPeriod, setSelectedPeriod] = useState<string>("1m");
	const [enabledIndicators, setEnabledIndicators] = useState<{
		[key: string]: boolean;
	}>(Object.fromEntries(indicators.map((ind) => [ind.key, ind.key == "RMI"])));
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const cachedDataRef = useRef<{ [key: string]: any }>({});
	const lastFetchTimeRef = useRef<{
		time: Date;
		period: string;
		enabledIndicators: { [key: string]: boolean };
	} | null>(null);
	const [currentStocks, setCurrentStocks] = useState<{ [key: string]: string }>(
		availableStocks
	);

	const toggleIndicator = (indicator: string) => {
		setEnabledIndicators((prev) => ({
			...prev,
			[indicator]: !prev[indicator],
		}));
	};

	const handleNotificationClick = (notification: Notification) => {
		onNotificationClick(
			notification.stock,
			selectedPeriod,
			notification.indicator
		);
	};

	const checkForSignals = useCallback(async () => {
		setError(null); // Clear any previous errors
		const symbols = Object.keys(currentStocks);
		const newNotifications: Notification[] = [];
		const currentTime = new Date();

		// Check if we need to fetch new data
		const shouldFetchNewData =
			!lastFetchTimeRef.current ||
			currentTime.getTime() - lastFetchTimeRef.current.time.getTime() >
				5 * 60 * 1000 ||
			selectedPeriod !== lastFetchTimeRef.current?.period ||
			JSON.stringify(enabledIndicators) !==
				JSON.stringify(lastFetchTimeRef.current?.enabledIndicators);

		try {
			let response;
			if (shouldFetchNewData) {
				setIsLoading(true);
				response = await fetchStockData(
					symbols.join(","),
					selectedPeriod,
					false,
					["Close"]
				);
				cachedDataRef.current = response;
				lastFetchTimeRef.current = {
					time: currentTime,
					period: selectedPeriod,
					enabledIndicators: { ...enabledIndicators },
				};
				setIsLoading(false);
			} else {
				response = cachedDataRef.current;
			}

			for (const symbol of symbols) {
				if (!response[symbol] || !response[symbol].history) {
					continue;
				}
				const history = response[symbol].history;
				const dates = Object.keys(history).map((date) => new Date(date));
				const closingPrices = dates
					.map((date) => {
						const formattedDate = format(date, "yyyy-MM-dd HH:mm:ss");
						return history[formattedDate]?.Close;
					})
					.filter((price) => price !== undefined) as number[];

				// Process indicators and generate notifications
				for (const indicator of indicators) {
					if (enabledIndicators[indicator.key]) {
						let indicatorValues, macdLine, signalLine;

						if (indicator.key === "MACD") {
							({ macdLine, signalLine } = indicator.calculate(closingPrices));
						} else {
							indicatorValues = indicator.calculate(closingPrices);
						}

						const { buyPoints, sellPoints, latestBuyPrice, latestSellPrice } =
							indicator.key === "MACD"
								? indicator.calculateProfit(closingPrices, macdLine, signalLine)
								: indicator.calculateProfit(closingPrices, indicatorValues);

						const addNotification = (
							signal: "buy" | "sell",
							price: number,
							timestamp: Date
						) => {
							newNotifications.push({
								id: `${symbol}-${indicator.key}-${signal}-${Date.now()}`,
								stock: symbol,
								indicator: indicator.key,
								signal,
								price,
								timestamp,
								isNew: timestamp > (lastUpdateTime || new Date(0)),
							});
						};

						if (latestBuyPrice !== null && buyPoints.length > 0) {
							const latestBuyPoint = buyPoints[buyPoints.length - 1];
							if (latestBuyPoint && typeof latestBuyPoint.x !== "undefined") {
								addNotification("buy", latestBuyPrice, dates[latestBuyPoint.x]);
							}
						} else if (latestSellPrice !== null && sellPoints.length > 0) {
							const latestSellPoint = sellPoints[sellPoints.length - 1];
							if (latestSellPoint && typeof latestSellPoint.x !== "undefined") {
								addNotification(
									"sell",
									latestSellPrice,
									dates[latestSellPoint.x]
								);
							}
						}
					}
				}
			}

			setNotifications(
				newNotifications.sort(
					(a, b) => b.timestamp.getTime() - a.timestamp.getTime()
				)
			);
			setLastUpdateTime(currentTime);
			setError(null); // Clear error after successful fetch
		} catch (error) {
			console.error("Error in checkForSignals:", error);
			setIsLoading(false);
			if (error instanceof Error) {
				setError(`Failed to fetch stock data: ${error.message}`);
			} else {
				setError("An unexpected error occurred while fetching stock data.");
			}
		}
	}, [currentStocks, selectedPeriod, enabledIndicators]);

	useEffect(() => {
		setCurrentStocks(availableStocks);
	}, [availableStocks]);

	useEffect(() => {
		checkForSignals(); // Trigger a new check when availableStocks changes or on mount

		const intervalId = setInterval(checkForSignals, 5 * 60 * 1000); // Check every 5 minutes

		return () => clearInterval(intervalId); // Cleanup the interval on unmount
	}, [checkForSignals, currentStocks, selectedPeriod, enabledIndicators]);

	return (
		<Card className="mt-4 w-full md:w-2/3 md:mx-auto">
			<CardHeader className="flex flex-wrap justify-between items-center">
				<CardTitle>Real-time Notifications</CardTitle>
				<CardDescription>
					Real-time buy/sell signals for portfolio stocks based on selected
					period and indicators.
				</CardDescription>
				{lastUpdateTime && (
					<div className="flex items-center justify-center text-sm text-gray-500">
						<span className="bg-green-500 h-3 w-3 rounded-full animate-pulse"></span>
						<span className="ml-2">
							Last updated: {format(lastUpdateTime, "yyyy-MM-dd HH:mm")}
						</span>
					</div>
				)}
				<div className="flex gap-2">
					<Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
						<SelectTrigger className="min-w-[120px]">
							<SelectValue placeholder="1 Month" />
						</SelectTrigger>

						<SelectContent>
							{periodOptions.map(({ value, label }) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline">Select Indicators</Button>
						</PopoverTrigger>
						<PopoverContent className="w-56">
							{indicators.map(({ key, label }) => (
								<div key={key} className="flex items-center space-x-2">
									<Checkbox
										id={key}
										checked={enabledIndicators[key]}
										onCheckedChange={() => toggleIndicator(key)}
									/>
									<label htmlFor={key}>{label}</label>
								</div>
							))}
						</PopoverContent>
					</Popover>
				</div>
			</CardHeader>
			<ScrollArea className="h-[400px] mt-2">
				<CardContent>
					{error && (
						<Alert variant="destructive" className="mb-4">
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					{isLoading ? (
						<p>Loading...</p>
					) : notifications.length === 0 ? (
						<p>No notifications at this time.</p>
					) : (
						<ul>
							{notifications.map((notification) => (
								<li
									key={notification.id}
									className={`mb-2 p-2 rounded ${
										notification.isNew ? "bg-green-100 border" : "bg-gray-100"
									} cursor-pointer hover:bg-opacity-80 transition-colors`}
									onClick={() => handleNotificationClick(notification)}
								>
									<span className="font-bold">{notification.stock}</span>{" "}
									{notification.indicator} gives a{" "}
									<span
										className={
											notification.signal === "buy"
												? "text-green-500"
												: "text-red-500"
										}
									>
										{notification.signal}
									</span>{" "}
									signal at ${notification.price.toFixed(2)}
									<span className="text-sm text-gray-500 ml-2">
										{format(notification.timestamp, "yyyy-MM-dd HH:mm")}
									</span>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</ScrollArea>
		</Card>
	);
};

export default NotificationBoard;
