import path from "path";
import { Configuration } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

const config: Configuration = {
  mode: "development",
  entry: "./src/main.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
  },
  resolve: {
    extensions: [".ts", "..."],
  },
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader" }],
  },
  plugins: [new HtmlWebpackPlugin({ template: "./public/index.html" })],
};

export default config;
