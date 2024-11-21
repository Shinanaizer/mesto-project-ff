


export function addCard(cardInfo, deleteCardReq, likeCard, openImageModalWindow, userIdMassive){
    const cardTemplate = document.getElementById('card-template').content;
    const copyCard = cardTemplate.querySelector('.card').cloneNode(true);
    const picture = copyCard.querySelector('.card__image');
    copyCard.querySelector('.card__title').textContent = cardInfo.name;
    picture.src = cardInfo.link;
    picture.alt = cardInfo.name;
    const copyCardDeleteButton = copyCard.querySelector('.card__delete-button');
    const copyCardLikeButton = copyCard.querySelector('.card__like-button');
    const copyCardLikeCounter = copyCard.querySelector('.like_counter');
    copyCardLikeButton.addEventListener('click', () => {
        likeCard(cardInfo._id, copyCardLikeButton, copyCardLikeCounter)
    });
    picture.addEventListener('click', function(){
        openImageModalWindow(cardInfo);
    });
    if (cardInfo.owner._id === userIdMassive._id) {
        copyCardDeleteButton.addEventListener('click', () => {
            deleteCardReq(cardInfo._id, copyCard);
        });
    } else {
        copyCardDeleteButton.remove();
    };
    copyCardLikeCounter.textContent = `${cardInfo.likes.length}`;
    return copyCard;
};


  

