export function openModal(modalWindow){
    modalWindow.classList.add('popup_is-animated');
    modalWindow.classList.add('popup_is-opened');
    document.addEventListener('keydown', escapeClose);
    modalWindow.addEventListener('click', closePopupByClick);
};

export function closeModal(openedModal){
    openedModal.classList.remove('popup_is-opened');   
    openedModal.removeEventListener('click', closePopupByClick);
    document.removeEventListener('keydown', escapeClose);
};

export function escapeClose(evt){
    if (evt.key === 'Escape'){
        const openedPopup = document.querySelector('.popup_is-opened');
        closeModal(openedPopup);
    }};

function closePopupByClick(evt){
    if (evt.target.classList.contains('popup__close') || evt.target === evt.currentTarget){
        const openedPopup = document.querySelector('.popup_is-opened');
        closeModal(openedPopup);
    }};
