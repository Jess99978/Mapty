"use strict";

class Exercise {
  constructor(distance, duration, coords) {
    this.distance = distance; // km
    this.duration = duration; // hr
    this.coords = coords; // [lat,long]
    this.date = new Date();
    this.id = (Date.now() + "").slice(-10);
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
    return Number((this.distance / (this.duration / 60)).toFixed(1));
  }
}

class Running extends Exercise {
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.type = "running";
    this._setDescription();
  }
}

class Cycling extends Exercise {
  constructor(distance, duration, coords, elev) {
    super(distance, duration, coords);
    this.elev = elev;
    this.type = "cycling";
    this._setDescription();
  }
}

// --- function ---
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const btnEdit = document.querySelector(".workout__btn--edit");
const btnDelete = document.querySelector(".workout__btn--delete");
const btnEditConfirm = document.querySelector(".form__btn--confirm");
const btnEditCancel = document.querySelector(".form__btn--cancel");
const btnCreateSubmit = document.querySelector(".form__btn--submit");

class App {
  #map;
  #clickLocation;
  #workout = [];
  #zoom = 13;
  #workoutEl;
  #workoutObj;
  #newWorkoutObj;

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    // event handler
    //   使用鍵盤 enter 送出表單
    form.addEventListener("submit", (e) => e.preventDefault());
    btnCreateSubmit.addEventListener("click", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToMarker.bind(this));
    containerWorkouts.addEventListener("click", this._editWorkout.bind(this));
    containerWorkouts.addEventListener(
      "click",
      this._showDeleteModal.bind(this)
    );
    btnEditConfirm.addEventListener("click", this._updateWorkout.bind(this));
    btnEditCancel.addEventListener("click", this._hideForm);
  }
  _getPosition() {
    // 用 geolocation API 取得當前位置
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("無法取得您當前的位置");
        }
      );
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#zoom);

    console.log(
      `https://www.google.com.tw/maps/@${latitude},${longitude},16z?entry=ttu`
    );

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    this.#workout.forEach((el) => {
      this._renderWorkoutMarker(el);
    });
  }
  _showForm(e) {
    this.#clickLocation = e;
    form.classList.remove("hidden");
    document.querySelector(".form__btn--group--edit").classList.add("hidden");
    document
      .querySelector(".form__btn--group--create")
      .classList.remove("hidden");
    inputDistance.focus();
    inputType.disabled = false;
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
  }
  _hideForm() {
    form.classList.add("hidden");
  }
  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _validateFormInputs() {
        const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    // 驗證表單數據合理性（需為數字，且不可小於 0)
    const isValidNum = (...inputs) => {
      return inputs.every((num) => !isNaN(num));
    };
    const isPositiveNum = (...inputs) => {
      return inputs.every((num) => num > 0);
    };
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !isValidNum(distance, duration, cadence) ||
        !isPositiveNum(distance, duration, cadence)
      ) {
        Swal.fire({
          title: "請輸入大於 0 的數字",
          icon: "warning",
        });
        return false;
      } else {
        return true
      }
    }
    if (type === "cycling") {
      const elev = +inputElevation.value;
      if (
        !isValidNum(distance, duration, elev) ||
        !isPositiveNum(distance, duration)
      ) {
       Swal.fire({
         title: "請輸入大於 0 的數字",
         text: "(海拔高度可以為負)",
         icon: "warning",
       });
        return false;
      } else {
        return true;
      }
    }
  }
  _editWorkout(e) {
    if (e.target.classList.contains("workout__btn--edit")) {
      form.classList.remove("hidden");
      inputDistance.focus();
      document
        .querySelector(".form__btn--group--edit")
        .classList.remove("hidden");
      document
        .querySelector(".form__btn--group--create")
        .classList.add("hidden");
      const data = this.#workoutObj;
      // 讀取舊的資料呈現至表單
      inputDistance.value = data.distance;
      inputDuration.value = data.duration;
      if (data.type === "cycling") {
        inputCadence.closest(".form__row").classList.add("form__row--hidden");
        inputElevation
          .closest(".form__row")
          .classList.remove("form__row--hidden");
        inputType.value = "cycling";
        console.log(data.elev);
        inputElevation.value = data.elev;
      }
      if (data.type === "running") {
        inputCadence
          .closest(".form__row")
          .classList.remove("form__row--hidden");
        inputElevation.closest(".form__row").classList.add("form__row--hidden");
        inputType.value = "running";
        inputCadence.value = data.cadence;
      }
      // Type disabled （無法修改）
      inputType.disabled = true;
      // 用新數據更新表單值
      if (
        this.#newWorkoutObj &&
        this.#newWorkoutObj.id === this.#workoutObj.id
      ) {
        console.log(this.#newWorkoutObj);
        inputDistance.value = this.#newWorkoutObj.distance;
        inputDuration.value = this.#newWorkoutObj.duration;
        if (data.type === "running") {
          inputCadence.value = this.#newWorkoutObj.cadence;
        } else if (data.type === "cycling") {
          inputElevation.value = this.#newWorkoutObj.elev;
        }
      }
    }
  }
  _updateWorkout(e) {
    const data = this.#workoutObj;
    this._validateFormInputs();
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

        this._validateFormInputs();
        if (!this._validateFormInputs()) return;
    // 從 localStorage 取得要更新的資料
    const oldArr = JSON.parse(localStorage.getItem("workouts"));
    const oldObj = oldArr.find((d) => d.id === this.#workoutObj.id);
    // 更新陣列，再重新 setLocalStorage
    oldObj.distance = +inputDistance.value;
    oldObj.duration = +inputDuration.value;
    oldObj.speed = Number(
      (+inputDistance.value / (+inputDuration.value / 60)).toFixed(1)
    );
    if (oldObj.cadence) {
      oldObj.cadence = +inputCadence.value;
    }
    if (oldObj.elev !== null) {
      oldObj.elev = +inputElevation.value;
    }
    const newArr = oldArr;
    this.#newWorkoutObj = newArr.find((obj) => obj.id === oldObj.id);
    console.log(this.#newWorkoutObj);
    localStorage.setItem("workouts", JSON.stringify(newArr));
    // 隱藏表單
    this._hideForm();
    // 重新渲染資料到列表上
    this._reRenderWorkoutList(this.#newWorkoutObj);
    Swal.fire({
      position: "center",
      icon: "success",
      title: "運動紀錄已更新",
      showConfirmButton: false,
      timer: 1800,
    });
  }
  _reRenderWorkoutList(workout) {
    const workoutsEl = document.querySelectorAll(".workout");
    let oldEl = Array.from(workoutsEl).find(
      (el) => el.dataset.id === workout.id
    );
    const workoutValue = oldEl.querySelectorAll(".workout__value");
    const { distance, duration, speed } = workout;
    const newData = [distance, duration, speed];
    if (workout.cadence) {
      const { cadence } = workout;
      newData.push(cadence);
      console.log(newData)
    }
    if (workout.elev !== null) {
      const { elev } = workout;
      newData.push(elev);
      console.log(newData)
    }
    workoutValue.forEach((w, i) => {
      w.textContent = newData[i];
    });
  }
  _showDeleteModal(e) {
    if (e.target.classList.contains("workout__btn--delete")) {
      Swal.fire({
        title: "你確定要刪除這項紀錄嗎?",
        showCancelButton: true,
        confirmButtonText: "確定",
        cancelButtonText: "取消",
      }).then((result) => {
        if (result.isConfirmed) {
          this._deleteWorkout();
          location.reload();
          Swal.fire({
            icon: "success",
            title: "已成功刪除",
            showConfirmButton: false,
            timer: 1800,
          });
        }
      });
    }
  }
  _deleteWorkout() {
    // 從 localStorage 取得要更新的資料
    const oldArr = JSON.parse(localStorage.getItem("workouts"));
    const oldObj = oldArr.find((d) => d.id === this.#workoutObj.id);
    console.log(oldArr);
    console.log(oldObj);
    const newArr = oldArr.filter((obj) => obj !== oldObj);
    console.log(newArr);
    localStorage.setItem("workouts", JSON.stringify(newArr));
    // 刪除該項運動的 DOM 元素
    this.#workoutEl.remove();
    // 用新陣列重新渲染 map
    newArr.forEach((el) => {
      this._renderWorkoutMarker(el);
    });
  }
  _newWorkout(e) {
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#clickLocation.latlng;
    let workout;
    this._validateFormInputs();
    if (!this._validateFormInputs()) return;
      if (type === "running") {
        // 若使用者選取的是 running，建立新物件
        const cadence = +inputCadence.value;
        workout = new Running(distance, duration, [lat, lng], cadence);
        this.#workout.push(workout);
        console.log(workout);
      }
    // 若使用者選取的是 cycling，建立新物件
    if (type === "cycling") {
      const elev = +inputElevation.value;
      workout = new Cycling(distance, duration, [lat, lng], elev);
      this.#workout.push(workout);
    }
    // 將新物件儲存至 workout array
    // console.log(this.#workout);
    // 渲染 workout array 的內容至地圖中
    console.log(this.#workout);
    console.log(workout);
    this._renderWorkoutMarker(workout);
    // 渲染 workout array 的內容至列表中
    this._renderWorkoutList(workout);
    console.log(this.#workout);
    console.log(workout);
    // 清空欄位內容、隱藏表單
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
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
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkoutList(workout) {
    let html = ` <li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2>
                    <div class="workout__control">
            <div class=""><img src="image/edit.svg" alt="edit" class="workout__btn--edit"></div>
            <div class=""><img src="image/delete.svg" alt="delete" class="workout__btn--delete"></div>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
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
    if (workout.type === "running") {
      html += `<div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
                  </li>`;
    } else if (workout.type === "cycling") {
      html += `<div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elev}</span>
            <span class="workout__unit">公尺</span>
          </div>
                  </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToMarker(e) {
    this.#workoutEl = e.target.closest(".workout");
    if (!this.#workoutEl) return;
    this.#workoutObj = this.#workout.find(
      (w) => w.id === this.#workoutEl.dataset.id
    );
    this.#map.setView(this.#workoutObj.coords, this.#zoom, {
      animate: true,
      duration: 0.8,
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workout = data;
    if (!this.#workout) return;
    this.#workout.forEach((el) => {
      this._renderWorkoutList(el);
    });
  }
}

const app = new App();
