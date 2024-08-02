// @todo: Темплейт карточки
const cardTemplate = document.getElementById('card-template').content;
// @todo: DOM узлы
const content = document.querySelector('.content');
const cardList = content.querySelector('.places__list');
// @todo: Функция создания карточки
function addCard(cardInfo, deleteCard){
    const copyCard = cardTemplate.querySelector('.card').cloneNode(true);
    copyCard.querySelector('.card__title').textContent = cardInfo.name;
    copyCard.querySelector('.card__image').src = cardInfo.link;
    copyCard.querySelector('.card__image').alt = cardInfo.name;
    const copyCardDeleteButton = copyCard.querySelector('.card__delete-button');
    copyCardDeleteButton.addEventListener('click', deleteCard);
    return copyCard;
};
// @todo: Функция удаления карточки
function deleteCard(evt){
    evt.target.closest('.card').remove();
};
// @todo: Вывести карточки на страницу
function sixCards(){
    initialCards.forEach(function(item){
    cardList.append(addCard(item, deleteCard));
    });
};
sixCards();


