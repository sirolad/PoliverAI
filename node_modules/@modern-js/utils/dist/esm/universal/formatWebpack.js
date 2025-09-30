import { _ as _sliced_to_array } from "@swc/helpers/_/_sliced_to_array";
import { _ as _type_of } from "@swc/helpers/_/_type_of";
var friendlySyntaxErrorLabel = "SyntaxError:";
function isLikelyASyntaxError(message) {
  return message.includes(friendlySyntaxErrorLabel);
}
function formatMessage(stats) {
  var lines = [];
  var message;
  if ((typeof stats === "undefined" ? "undefined" : _type_of(stats)) === "object") {
    var fileName = stats.moduleName ? "File: ".concat(stats.moduleName, "\n") : "";
    var mainMessage = typeof stats.formatted === "string" ? stats.formatted : stats.message;
    var details = stats.details ? "\nDetails: ".concat(stats.details, "\n") : "";
    var stack = stats.stack ? "\n".concat(stats.stack) : "";
    message = "".concat(fileName).concat(mainMessage).concat(details).concat(stack);
  } else {
    message = stats;
  }
  lines = message.split("\n");
  lines = lines.map(function(line) {
    var parsingError = /Line (\d+):(?:(\d+):)?\s*Parsing error: (.+)$/.exec(line);
    if (!parsingError) {
      return line;
    }
    var _parsingError = _sliced_to_array(parsingError, 4), errorLine = _parsingError[1], errorColumn = _parsingError[2], errorMessage = _parsingError[3];
    return "".concat(friendlySyntaxErrorLabel, " ").concat(errorMessage, " (").concat(errorLine, ":").concat(errorColumn, ")");
  });
  message = lines.join("\n");
  message = message.replace(/SyntaxError\s+\((\d+):(\d+)\)\s*(.+?)\n/g, "".concat(friendlySyntaxErrorLabel, " $3 ($1:$2)\n"));
  lines = message.split("\n");
  if (lines.length > 2 && lines[1].trim() === "") {
    lines.splice(1, 1);
  }
  lines[0] = lines[0].replace(/^(.*) \d+:\d+-\d+$/, "$1");
  if (lines[1] && lines[1].indexOf("Module not found:") !== -1) {
    lines[1] = lines[1].replace("Error: ", "");
  }
  lines = lines.filter(function(line, index, arr) {
    return index === 0 || line.trim() !== "" || line.trim() !== arr[index - 1].trim();
  });
  message = lines.join("\n");
  return message.trim();
}
var noop = function(message) {
  return message;
};
var defaultColor = {
  gray: noop,
  cyan: noop,
  green: noop,
  yellow: noop,
  underline: noop
};
function addErrorTips(errors) {
  var color = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : defaultColor;
  var errorHelpers = [
    {
      validator: function validator(message) {
        return (message.includes("You may need an appropriate loader") || message.includes("You may need an additional loader")) && message.includes(".ts");
      },
      formatter: function formatter(message) {
        return "".concat(message, "\n\n").concat(color.yellow('If it is a TypeScript file, you can use "source.include" config to compile it. see '.concat(color.underline("https://modernjs.dev/en/configure/app/source/include.html"))), "\n\n").concat(color.green("".concat(color.gray("// config file"), "\nexport default {\n  source: {\n    include: [\n      ").concat(color.gray("// add some include rules"), "\n    ]\n  }\n}")), "\n        ");
      }
    }
  ];
  return errors.map(function(error) {
    var helper = errorHelpers.find(function(item) {
      return item.validator(error);
    });
    return helper ? helper.formatter(error) : error;
  });
}
function formatWebpackMessages(json) {
  var color = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : defaultColor;
  var _json_errors, _json_warnings, _result_errors;
  var formattedErrors = json === null || json === void 0 ? void 0 : (_json_errors = json.errors) === null || _json_errors === void 0 ? void 0 : _json_errors.map(formatMessage);
  var formattedWarnings = json === null || json === void 0 ? void 0 : (_json_warnings = json.warnings) === null || _json_warnings === void 0 ? void 0 : _json_warnings.map(formatMessage);
  var result = {
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
