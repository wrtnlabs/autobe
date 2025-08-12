interface ITextInputProps {
  defaultValue: string;
  setInput: (value: string) => void;
  onEnterKey: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}
const TextInput = (props: ITextInputProps) => {
  const { defaultValue, setInput, onEnterKey } = props;
  return (
    <>
      <input
        type="text"
        value={defaultValue}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEnterKey(e);
          }
        }}
        placeholder="메시지를 입력하세요..."
        className="w-full p-2 pr-12 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => {}}
        className="absolute right-6 bottom-6 text-blue-500 hover:text-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 transform rotate-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </>
  );
};

export default TextInput;
