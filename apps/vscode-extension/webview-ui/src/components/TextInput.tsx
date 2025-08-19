interface ITextInputProps {
  defaultValue: string;
  setInput: (value: string) => void;
  onEnterKey: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const TextInput = (props: ITextInputProps) => {
  const { defaultValue, setInput, onEnterKey } = props;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnterKey(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"; // 최대 120px
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <textarea
        value={defaultValue}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요... (Shift + Enter로 줄바꿈)"
        className="w-full p-3 pr-12 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[60px] max-h-[120px] leading-relaxed"
        rows={2}
        style={{ height: "60px" }}
      />
      <button
        onClick={() => {}}
        className="absolute right-3 bottom-3 text-blue-500 hover:text-blue-600 transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 transform rotate-90"
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
    </div>
  );
};

export default TextInput;
