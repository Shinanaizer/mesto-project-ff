const showError = (formElement, inputElement, errorMessage, validationConfig) => {
  const errorElement = formElement.querySelector(`.${inputElement.id}-error`);
  inputElement.classList.add(validationConfig.inputErrorClass);
  errorElement.textContent = errorMessage;
  errorElement.classList.add(validationConfig.errorClass);
};

const hideError = (formElement, inputElement, validationConfig) => {
  const errorElement = formElement.querySelector(`.${inputElement.id}-error`);
  inputElement.classList.remove(validationConfig.inputErrorClass);
  errorElement.classList.remove(validationConfig.errorClass)
  errorElement.textContent = '';
};

const checkValidation = (formElement, inputElement, validationConfig) => {
  if (inputElement.validity.patternMismatch){
    inputElement.setCustomValidity(inputElement.dataset.errorMessage);
  } else {
    inputElement.setCustomValidity("");
  };
  if (!inputElement.validity.valid) {
    showError(formElement, inputElement, inputElement.validationMessage, validationConfig);
  } else {
    hideError(formElement, inputElement, validationConfig);
  }
};

function setEventListeners(formElement, validationConfig){
  const inputList = Array.from(formElement.querySelectorAll(validationConfig.inputSelector));
  const buttonElement = formElement.querySelector(validationConfig.submitButtonSelector);
  toggleButtonState(inputList, buttonElement, validationConfig);
  inputList.forEach(function(inputElement){
    inputElement.addEventListener('input', function(){
      checkValidation(formElement, inputElement, validationConfig);
      toggleButtonState(inputList, buttonElement, validationConfig);
    });
  });
};

export function enableValidation(validationConfig){
  const formList = Array.from(document.querySelectorAll(validationConfig.formSelector));
  formList.forEach(function(formElement){
    formElement.addEventListener('submit', function(evt){
      evt.preventDefault();
      });
      setEventListeners(formElement, validationConfig);
  });
};

function hasInvalidInput(inputList){
  return inputList.some((inputElement) => {
    return !inputElement.validity.valid;
  });
};

function toggleButtonState(inputList, buttonElement, validationConfig){
  if(hasInvalidInput(inputList)){
    buttonElement.classList.add(validationConfig.inactiveButtonClass)
     } else {
      buttonElement.classList.remove(validationConfig.inactiveButtonClass)
    };
};

export function clearValidation (formElement, validationConfig){
      const inputList = Array.from(formElement.querySelectorAll(validationConfig.inputSelector));
      const buttonElement = formElement.querySelector(validationConfig.submitButtonSelector);
      inputList.forEach(function(inputElement){
      hideError(formElement, inputElement, validationConfig);
      toggleButtonState(inputList, buttonElement, validationConfig);
})};