import { IAutoBeTokenUsageJson } from "@autobe/interface";

import { toCompactNumberFormat } from "../util/number";

interface ITokenUsageCardProps {
  tokenUsage: IAutoBeTokenUsageJson;
}

const TokenUsageCard = ({ tokenUsage }: ITokenUsageCardProps) => {
  return (
    <header className="p-4 w-full">
      <div className="border border-gray-300 rounded-lg bg-gray-50 p-4 shadow-sm w-full">
        <div className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
          Token Usage
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Input:</span>
            <span className="text-blue-600 font-semibold">
              {toCompactNumberFormat(tokenUsage.aggregate.input.total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Output:</span>
            <span className="text-green-600 font-semibold">
              {toCompactNumberFormat(tokenUsage.aggregate.output.total)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-semibold">Total:</span>
            <span className="text-purple-600 font-bold text-lg">
              {toCompactNumberFormat(tokenUsage.aggregate.total)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TokenUsageCard;
