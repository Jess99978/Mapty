'use strict';

class Exercise {
  constructor(distance, duration, coords) {
    this.distance = distance; // km
    this.duration = duration; // hr
    this.coords = coords; // [lat,long]
    this.date = new Date();
    this.id = (Date.now() + '').slice(-10);
    this.speed = this.calcSpeed();
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  calcSpeed() {
    return (this.distance / (this.duration / 60)).toFixed(1);
  }
}

class Running extends Exercise {
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.type = 'running';
    this._setDescription();
  }
}

class Cycling extends Exercise {
  constructor(distance, duration, coords, elev) {
    super(distance, duration, coords);
    this.elev = elev;
    this.type = 'cycling';
    this._setDescription();
  }
}

// --- function ---
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #clickLocation;
  #workout = [];
  #zoom = 13;

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    // event handler
    //   使用鍵盤 enter 送出表單
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
  }
  _getPosition() {
    // 用 geolocation API 取得當前位置
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('無法取得您當前的位置');
        }
      );
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#zoom);

    // console.log(
    //   `https://www.google.com.tw/maps/@${latitude},${longitude},16z?entry=ttu`
    // );
      
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
      this.#workout.forEach(el => {
        this._renderWorkoutMarker(el);
      });

  }
  _showForm(e) {
    this.#clickLocation = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();
    // 驗證表單數據合理性（需為數字，且不可小於 0)
    const isValidNum = (...inputs) => {
      return inputs.every(num => !isNaN(num));
    };
    const isPositiveNum = (...inputs) => {
      return inputs.every(num => num > 0);
    };

    // 取得表單內的數據
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#clickLocation.latlng;
    let workout;

    // 若使用者選取的是 running，建立新物件
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !isValidNum(distance, duration, cadence) ||
        !isPositiveNum(distance, duration, cadence)
      ) {
        alert('請輸入大於 0 的數字');
        return;
      }
      workout = new Running(distance, duration, [lat, lng], cadence);
        this.#workout.push(workout);
        console.log(workout)
    }
    // 若使用者選取的是 cycling，建立新物件
    if (type === 'cycling') {
      const elev = +inputElevation.value;
      if (
        !isValidNum(distance, duration, elev) ||
        !isPositiveNum(distance, duration)
      ) {
        alert('請輸入大於 0 的數字');
        return;
      }
      workout = new Cycling(distance, duration, [lat, lng], elev);
      this.#workout.push(workout);
    }
    // 將新物件儲存至 workout array
    // console.log(this.#workout);
    // 渲染 workout array 的內容至地圖中
    this._renderWorkoutMarker(workout);
    // 渲染 workout array 的內容至列表中
    this._renderWorkoutList(workout);
    // 清空欄位內容、隱藏表單
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    this._hideForm();
    //   將新創建的運動數據儲存至 localStorage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkoutList(workout) {
    let html = ` <li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">公里</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">分鐘</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
`;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
                  </li>`;
    } else if (workout.type === 'cycling') {
      html += `<div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elev}</span>
            <span class="workout__unit">公尺</span>
          </div>
                  </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToMarker(e) {
    const target = e.target.closest('.workout');
    if (!target) return;
    const thisWorkout = this.#workout.find(w => w.id === target.dataset.id);
    this.#map.setView(thisWorkout.coords, this.#zoom, {
      animate: true,
      duration: 0.8,
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workout = data;
    if (!this.#workout) return;
    this.#workout.forEach(el => {
      this._renderWorkoutList(el);
    });
  }
}

const app = new App();
