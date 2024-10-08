from flask import Flask, jsonify, request
import openai
import os
import pandas as pd
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

        # Get the 'index' parameter from the query string, defaulting to None
        index_columns = request.args.get('index', None)

        # Convert index parameter to a list if provided
        if index_columns:
            index_columns = index_columns.split(',')

        # Initialize the Tickers object with the list of symbols
        tickers = yf.Tickers(symbols.replace(',', ' '))  # yfinance Tickers expects space-separated symbols

        data = {}

        for symbol in symbols.split(','):
            ticker = tickers.tickers[symbol]
            hist = ticker.history(period=period, interval=interval)
            # Convert the DataFrame index (Timestamps) to strings
            hist.index = hist.index.strftime('%Y-%m-%d %H:%M:%S')

            if index_columns:
                # Filter to include only specified columns
                hist = hist[index_columns]

            if getAll:
                # Add full data for this symbol to the result dictionary
                data[symbol] = {
                    "history": hist.to_dict(orient="index"),
                    "volume": ticker.info.get("volume", None),
                    "avgVolume": ticker.info.get("averageVolume", None),
                    "marketCap": ticker.info.get("marketCap", None),
                    "week52High": ticker.info.get("fiftyTwoWeekHigh", None),
                    "week52Low": ticker.info.get("fiftyTwoWeekLow", None),
                    "peRatio": ticker.info.get("trailingPE", None),
                    "dividendYield": ticker.info.get("dividendYield", None)
                }
            else:
                # Add only the history to the result dictionary
                data[symbol] = {
                    "history": hist.to_dict(orient="index"),
                }

        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/financial/<symbol>', methods=['GET'])
def get_financial_data(symbol):
    try:
        # Fetch the stock data
        stock = yf.Ticker(symbol)

        # Get the income statement
        income_statement = stock.financials

        # Fill NaN values with None
        income_statement = income_statement.replace({pd.NA: None})
        # Extract relevant data from the income statement for multiple years
        years = income_statement.columns
        financial_data = []
        for year in years:
            financial_data.append({
                'year': year,
                'revenue': income_statement.loc['Total Revenue'].get(year, None) if 'Total Revenue' in income_statement.index else None,
                'cost_of_revenue': income_statement.loc['Cost Of Revenue'].get(year, None) if 'Cost Of Revenue' in income_statement.index else None,
                'gross_profit': income_statement.loc['Gross Profit'].get(year, None) if 'Gross Profit' in income_statement.index else None,
                'operating_expenses': income_statement.loc['Operating Expense'].get(year, None) if 'Operating Expense' in income_statement.index else None,
                'net_income': income_statement.loc['Net Income'].get(year, None) if 'Net Income' in income_statement.index else None,
                'tax_provision': income_statement.loc['Tax Provision'].get(year, None) if 'Tax Provision' in income_statement.index else None,   
                'ebitda': income_statement.loc['EBITDA'].get(year, None) if 'EBITDA' in income_statement.index else None,
                'interest_expense': income_statement.loc['Interest Expense'].get(year, None) if 'Interest Expense' in income_statement.index else None,
                'interest_income': income_statement.loc['Interest Income'].get(year, None) if 'Interest Income' in income_statement.index else None,
                'research_and_development': income_statement.loc['Research And Development'].get(year, None) if 'Research And Development' in income_statement.index else None,
                'selling_general_and_administration': income_statement.loc['Selling General And Administration'].get(year, None) if 'Selling General And Administration' in income_statement.index else None
            })

        return jsonify(financial_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    

@app.route('/api/generate-summary', methods=['GET'])
def generate_summary():
    try:
        stock_info = request.args.get('stockInfo', '')
        # Here you would typically call your AI model to generate a summary
        # For now, we'll just return a placeholder response
        openai.api_key = os.getenv("OPENAI_API_KEY")

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Make coherent paragraphs. Use markdown to format the response."},
                {"role": "user", "content": f"{stock_info}."}
            ]
        )
        summary = response.choices[0].message.content

        return jsonify({"summary": summary}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
