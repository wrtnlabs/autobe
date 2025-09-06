function validateInterfaceName(name: string): boolean {
  // I로 시작하는지 체크
  if (!name.startsWith("I")) return false;

  // PascalCase 패턴 체크 (I 다음에 대문자로 시작)
  const pascalCasePattern = /^I[A-Z][a-zA-Z0-9]*$/;
  return pascalCasePattern.test(name);
}

// 테스트
console.log(validateInterfaceName("IShoppingMallRegisteredCustomer")); // true
console.log(validateInterfaceName("IShoppingMallRegisteredcustomer")); // false

// 더 구체적으로 어디가 틀렸는지 체크
function checkNamingIssues(name: string): string[] {
  const issues: string[] = [];

  if (!name.startsWith("I")) {
    issues.push("I로 시작해야 함");
  }

  // 연속된 소문자 다음에 대문자가 와야 하는 패턴 체크
  const words = name.slice(1).split(/(?=[A-Z])/);
  words.forEach((word) => {
    if (word && word[0] !== word[0].toUpperCase()) {
      issues.push(`단어 "${word}"의 첫 글자가 소문자임`);
    }
  });

  return issues;
}

console.log(checkNamingIssues("IShoppingMallRegisteredcustomer"));
