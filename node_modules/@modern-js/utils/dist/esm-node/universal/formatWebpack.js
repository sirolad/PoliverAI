const friendlySyntaxErrorLabel = "SyntaxError:";
function isLikelyASyntaxError(message) {
  return message.includes(friendlySyntaxErrorLabel);
}
function formatMessage(stats) {
  let lines = [];
  let message;
  if (typeof stats === "object") {
    const fileName = stats.moduleName ? `File: ${stats.moduleName}
` : "";
    const mainMessage = typeof stats.formatted === "string" ? stats.formatted : stats.message;
    const details = stats.details ? `
Details: ${stats.details}
` : "";
    const stack = stats.stack ? `
${stats.stack}` : "";
    message = `${fileName}${mainMessage}${details}${stack}`;
  } else {
    message = stats;
  }
  lines = message.split("\n");
  lines = lines.map((line) => {
    const parsingError = /Line (\d+):(?:(\d+):)?\s*Parsing error: (.+)$/.exec(line);
    if (!parsingError) {
      return line;
    }
    const [, errorLine, errorColumn, errorMessage] = parsingError;
    return `${friendlySyntaxErrorLabel} ${errorMessage} (${errorLine}:${errorColumn})`;
  });
  message = lines.join("\n");
  message = message.replace(/SyntaxError\s+\((\d+):(\d+)\)\s*(.+?)\n/g, `${friendlySyntaxErrorLabel} $3 ($1:$2)
`);
  lines = message.split("\n");
  if (lines.length > 2 && lines[1].trim() === "") {
    lines.splice(1, 1);
  }
  lines[0] = lines[0].replace(/^(.*) \d+:\d+-\d+$/, "$1");
  if (lines[1] && lines[1].indexOf("Module not found:") !== -1) {
    lines[1] = lines[1].replace("Error: ", "");
  }
  lines = lines.filter((line, index, arr) => index === 0 || line.trim() !== "" || line.trim() !== arr[index - 1].trim());
  message = lines.join("\n");
  return message.trim();
}
const noop = (message) => message;
const defaultColor = {
  gray: noop,
  cyan: noop,
  green: noop,
  yellow: noop,
  underline: noop
};
function addErrorTips(errors, color = defaultColor) {
  const errorHelpers = [
    {
      validator(message) {
        return (message.includes("You may need an appropriate loader") || message.includes("You may need an additional loader")) && message.includes(".ts");
      },
      formatter(message) {
        return `${message}

${color.yellow(`If it is a TypeScript file, you can use "source.include" config to compile it. see ${color.underline("https://modernjs.dev/en/configure/app/source/include.html")}`)}

${color.green(`${color.gray("// config file")}
export default {
  source: {
    include: [
      ${color.gray("// add some include rules")}
    ]
  }
}`)}
        `;
      }
    }
  ];
  return errors.map((error) => {
    const helper = errorHelpers.find((item) => item.validator(error));
    return helper ? helper.formatter(error) : error;
  });
}
function formatWebpackMessages(json, color = defaultColor) {
  var _json_errors, _json_warnings, _result_errors;
  const formattedErrors = json === null || json === void 0 ? void 0 : (_json_errors = json.errors) === null || _json_errors === void 0 ? void 0 : _json_errors.map(formatMessage);
  const formattedWarnings = json === null || json === void 0 ? void 0 : (_json_warnings = json.warnings) === null || _json_warnings === void 0 ? void 0 : _json_warnings.map(formatMessage);
  const result = {
    errors: formattedErrors || [],
    warnings: formattedWarnings || [],
    errorTips: []
  };
  if ((_result_errors = result.errors) === null || _result_errors === void 0 ? void 0 : _result_errors.some(isLikelyASyntaxError)) {
    result.errors = result.errors.filter(isLikelyASyntaxError);
  }
  if (result.errors.length > 1) {
    result.errors.length = 1;
  }
  result.errors = addErrorTips(result.errors, color);
  return result;
}
export {
  addErrorTips,
  formatWebpackMessages
};
