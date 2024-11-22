export function addCard(cardInfo, deleteCard, likeCard, openImageModalWindow, userId, likeReq, dislikeReq, deleteCardReq){
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
      likeCard(cardInfo._id, copyCardLikeButton, copyCardLikeCounter, likeReq, dislikeReq)
    });
    picture.addEventListener('click', function(){
      openImageModalWindow(cardInfo);
    });
    if (cardInfo.owner._id === userId) {
      copyCardDeleteButton.addEventListener('click', () => {
      deleteCard(cardInfo._id, copyCard, deleteCardReq);
      });
    } else {
        copyCardDeleteButton.remove();
    };
    copyCardLikeCounter.textContent = `${cardInfo.likes.length}`;
    return copyCard;
};

export function handleLikes(id, likeButton, likeCounter, likeRequest, dislikeRequest){
    if (likeButton.classList.contains('card__like-button_is-active')) {
      return dislikeRequest(id).then((res) => {
        likeButton.classList.remove('card__like-button_is-active');
        likeCounter.textContent = `${res.likes.length}`
      })
      .catch((err) => {
        console.log(err);
      });
    } else {
      return likeRequest(id).then((res) => {
        likeButton.classList.add('card__like-button_is-active');
        likeCounter.textContent = `${res.likes.length}`
      }) 
      .catch((err) => {
        console.log(err);
      })
    }
  };

  export function handleDelete(id, cardElement, deleteReq){ 
    return deleteReq(id).then(() => {
       cardElement.remove()
     })
     .catch((err) => {
       console.log(err);
     })
   };

  

