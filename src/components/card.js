import {openModal} from './modal';

export function addCard(cardInfo, deleteCard){
    const cardTemplate = document.getElementById('card-template').content;
    const copyCard = cardTemplate.querySelector('.card').cloneNode(true);
    copyCard.querySelector('.card__title').textContent = cardInfo.name;
    copyCard.querySelector('.card__image').src = cardInfo.link;
    copyCard.querySelector('.card__image').alt = cardInfo.name;
    const copyCardDeleteButton = copyCard.querySelector('.card__delete-button');
    copyCardDeleteButton.addEventListener('click', deleteCard);
    const copyCardLikeButton = copyCard.querySelector('.card__like-button');
    copyCardLikeButton.addEventListener('click', likeCard);
    const picture = copyCard.querySelector('.card__image');
    picture.addEventListener('click', function(){
        const imageModal = document.querySelector('.popup_type_image');
        imageModal.querySelector('.popup__caption').textContent = cardInfo.name;
        imageModal.querySelector('.popup__image').src = cardInfo.link;
        imageModal.querySelector('.popup__image').alt = cardInfo.name;
        openModal(imageModal);
    });
        return copyCard;
};

export function likeCard(evt){
    evt.target.closest('.card__like-button').classList.toggle('card__like-button_is-active');
};

export function deleteCard(evt){
    evt.target.closest('.card').remove();
};
