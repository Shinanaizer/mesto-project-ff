

export function addCard(cardInfo, deleteCard, likeCard, imageModalOpen){
    const cardTemplate = document.getElementById('card-template').content;
    const copyCard = cardTemplate.querySelector('.card').cloneNode(true);
    const picture = copyCard.querySelector('.card__image');
    copyCard.querySelector('.card__title').textContent = cardInfo.name;
    picture.src = cardInfo.link;
    picture.alt = cardInfo.name;
    const copyCardDeleteButton = copyCard.querySelector('.card__delete-button');
    copyCardDeleteButton.addEventListener('click', deleteCard);
    const copyCardLikeButton = copyCard.querySelector('.card__like-button');
    copyCardLikeButton.addEventListener('click', likeCard);
    picture.addEventListener('click', function(){
        imageModalOpen(cardInfo);
    });
    return copyCard;
};


export function likeCard(evt){
    evt.target.closest('.card__like-button').classList.toggle('card__like-button_is-active');
  };

export function deleteCard(evt){
    evt.target.closest('.card').remove();
};
