from flask import Flask, jsonify, request
import yfinance as yf
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Mapping user selection to yfinance's period and interval
period_interval_map = {
    "1d": ("1d", "1m"),
    "1w": ("5d", "5m"),
    "1m": ("1mo", "1h"),
    "3m": ("3mo", "1h"),
    "ytd": ("ytd", "1h"),
    "1y": ("1y", "1h"),
    "all": ("max", "1mo")
}

@app.route('/api/stock/<symbols>', methods=['GET'])
def get_stock_data(symbols):
    try:
        # Get the user-specified period from the query string
        period_key = request.args.get('period', '1m')  # Default to '1m' if not provided

        if period_key not in period_interval_map:
            return jsonify({"error": "Invalid period specified"}), 400

        period, interval = period_interval_map[period_key]

        # Get the 'getAll' parameter from the query string, defaulting to 'true'
        getAll = request.args.get('getAll', 'true').lower() == 'true'

        # Initialize the Tickers object with the list of symbols
        tickers = yf.Tickers(symbols.replace(',', ' '))  # yfinance Tickers expects space-separated symbols

        data = {}

        for symbol in symbols.split(','):
            ticker = tickers.tickers[symbol]
            hist = ticker.history(period=period, interval=interval)
            # Convert the DataFrame index (Timestamps) to strings
            hist.index = hist.index.strftime('%Y-%m-%d %H:%M:%S')

            if getAll:
                # Add full data for this symbol to the result dictionary
                data[symbol] = {
                    "volume": ticker.info["volume"],
                    "avgVolume": ticker.info["averageVolume"],
                    "history": hist.to_dict(orient="index"),
                    "marketCap": ticker.info["marketCap"],
                    "week52High": ticker.info["fiftyTwoWeekHigh"],
                    "week52Low": ticker.info["fiftyTwoWeekLow"],
                    "peRatio": ticker.info["trailingPE"],
                    # "dividendYield": ticker.info["dividendYield"]
                }
            else:
                # Add only the history to the result dictionary
                data[symbol] = {
                    "history": hist.to_dict(orient="index"),
                }

        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
