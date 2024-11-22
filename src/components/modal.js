export function openModal(modalWindow){
    modalWindow.classList.add('popup_is-opened');
    document.addEventListener('keydown', escapeClose);
    modalWindow.addEventListener('click', closePopupByClick);
};

export function closeModal(){
    const openedPopup = document.querySelector('.popup_is-opened');
    openedPopup.classList.remove('popup_is-opened');   
    openedPopup.removeEventListener('click', closePopupByClick);
    document.removeEventListener('keydown', escapeClose);
};

export function escapeClose(evt){
    if (evt.key === 'Escape'){
        const openedPopup = document.querySelector('.popup_is-opened');
        closeModal();
    }};

function closePopupByClick(evt){
    if (evt.target.classList.contains('popup__close') || evt.target === evt.currentTarget){
        closeModal();
    }};
