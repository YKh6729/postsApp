const { error } = require("console");

const postsSchema = {
  title: {
    type: "string",
    maxLength: 15,
    minLength: 8,
    required: true,
  },
  subtitle: {
    type: "string",
    maxLength: 50,
    minLength: 10,
    required: false,
  },
  author: {
    type: "object",
    schema: {
      firstName: {
        type: "string",
        maxLength: 15,
        minLength: 0,
        required: true,
      },
      lastName: {
        type: "string",
        maxLength: 20,
        minLength: 0,
        required: true,
      },
      age: {
        type: "number",
        min: 18,
        max: 100,
        required: true,
      },
    },
    required: true,
  },
};

const patchSchema = {
  title: {
    type: "string",
    maxLength: 15,
    minLength: 8,
    required: false,
  },
  subtitle: {
    type: "string",
    maxLength: 50,
    minLength: 10,
    required: false,
  },
  author: {
    type: "object",
    schema: {
      firstName: {
        type: "string",
        maxLength: 15,
        minLength: 0,
        required: true,
      },
      lastName: {
        type: "string",
        maxLength: 20,
        minLength: 0,
        required: true,
      },
      age: {
        type: "number",
        min: 18,
        max: 100,
        required: true,
      },
    },
    required: false,
  },
};

const validate = (obj, schema) => {
  let isValid = true;
  let message = "";
  if (typeof obj !== "object" || obj.length !== undefined) {
    isValid = false;
    return { isValid, error: new Error("Not an object.") };
  }
  const props = Object.keys(schema);
  const objectKeys = Object.keys(obj);
  if (!objectKeys.length) {
    return { isValid: false, error: new Error("Object is empty.") };
  }
  objectKeys.forEach((key) => {
    if (props.indexOf(key) === -1) {
      isValid = false;
      message = `There shouldn't be property with name ${key}`;
    }
  });

  if (isValid) {
    return {
      isValid,
      error: message,
    };
  }

  props.forEach((prop) => {
    let propertyIs = obj.hasOwnProperty(prop);
    if (!propertyIs && schema[prop].required) {
      isValid = false;
      message += "Properties are incomplete ";
    } else if (typeof obj[prop] !== schema[prop].type) {
      if (propertyIs) {
        isValid = false;
        message += `Type of ${prop} is uncorrect `;
      }
    } else if (typeof obj[prop] === "string") {
      if (
        obj[prop].length < schema[prop].minLength ||
        obj[prop].length > schema[prop].maxLength
      ) {
        isValid = false;
        message += `${prop} is wrong`;
      }
    } else if (typeof obj[prop] === "number") {
      if (obj[prop] > schema[prop].max || obj[prop] < schema[prop].min) {
        isValid = false;
        isNumber = true;
        message += `${prop} is wrong`;
      }
    } else if (typeof obj[prop] === "object") {
      let result = validate(obj[prop], schema[prop].schema);
      if (!result.isValid) {
        isValid = false;
        message += `${prop} ${result.error} `;
      }
    }
  });

  return { isValid, error: message ? new Error(message) : null };
};

module.exports = {
  patchSchema,
  postsSchema,
  validate,
};
