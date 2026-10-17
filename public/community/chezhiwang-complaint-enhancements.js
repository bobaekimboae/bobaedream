(function () {
  'use strict';

  var originalRender = window.renderChezhiwangComplaintBoardTable;
  if (typeof originalRender !== 'function') return;

  var userIcon = '../icons/chotot/chotot-common-user.svg';
  var cameraIcon = 'assets/chzzk-detail/icons/camera.svg';
  var videoIcon = 'assets/reddit-ui/video.svg';
  var documentIcon = 'assets/reddit-ui/write.svg';

  function sectionIcon(src) {
    var image = document.createElement('img');
    image.className = 'czw-section-icon';
    image.src = src;
    image.alt = '';
    return image;
  }

  function addSectionIcons(form) {
    var sections = form.querySelectorAll('.czw-section');
    var icons = [
      [userIcon, '작성자'],
      ['../icons/chotot/chotot-common-location-icon.svg', '차량'],
      ['../icons/dealer-profile/dealership.svg', '업체'],
      [cameraIcon, '첨부'],
      [documentIcon, '불만 내용']
    ];
    sections.forEach(function (section, index) {
      var heading = section.querySelector('h2');
      if (heading && icons[index]) heading.prepend(sectionIcon(icons[index][0]));
    });
  }

  function replaceAge(form) {
    var oldAge = form.elements.age;
    if (!oldAge || oldAge.tagName !== 'SELECT') return;
    var input = document.createElement('input');
    input.name = 'age';
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 3;
    input.autocomplete = 'off';
    input.placeholder = '나이 입력';
    oldAge.replaceWith(input);
    var label = input.closest('.czw-field');
    if (label) {
      var title = label.querySelector('span');
      if (title) title.textContent = '나이 *';
    }
  }

  function removeOptionalGender(form) {
    var optional = form.querySelector('[data-choice="gender"] [data-value="선택 안 함"]');
    if (optional) optional.remove();
  }

  function addRequiredNotice(form) {
    var notice = document.createElement('p');
    notice.className = 'czw-required-note';
    notice.innerHTML = '<b>*</b> 필수 항목입니다. 사실 확인을 위해 정확히 입력해 주세요. 공개 후에는 차량·사건 정보 수정이 제한될 수 있습니다.';
    form.prepend(notice);
  }

  function addRegistrationUpload(form) {
    var generation = form.elements.generation;
    if (!generation) return;
    var field = generation.closest('.czw-field');
    if (!field) return;
    var block = document.createElement('section');
    block.className = 'czw-registration-upload';
    block.innerHTML =
      '<div class="czw-registration-head"><strong>자동차등록증으로 차량 정보 입력</strong><button type="button" data-registration-example>예시 보기</button></div>' +
      '<button type="button" class="czw-registration-button" data-registration-upload>' +
      '<img src="' + documentIcon + '" alt=""><span>자동차등록증 촬영·업로드<small>사진은 공개되지 않으며 차량 정보 확인에만 사용됩니다.</small></span></button>' +
      '<p class="czw-registration-example" hidden>소유자 이름과 주민등록번호 뒷자리를 가린 뒤, 문서 전체가 보이게 촬영해 주세요.</p>';
    field.insertAdjacentElement('afterend', block);
    block.querySelector('[data-registration-example]').onclick = function () {
      var example = block.querySelector('.czw-registration-example');
      example.hidden = !example.hidden;
      this.textContent = example.hidden ? '예시 보기' : '예시 닫기';
    };
    block.querySelector('[data-registration-upload]').onclick = function () {
      this.classList.add('is-ready');
      this.querySelector('strong');
      this.querySelector('span').firstChild.nodeValue = '자동차등록증 선택 화면 확인 완료';
    };
    var vehicleChoices = form.querySelectorAll('[data-choice="vehicle"] button');
    function syncDocumentCopy() {
      var isMotorcycle = form.querySelector('[data-choice="vehicle"] [data-value="motorcycle"].on');
      block.querySelector('.czw-registration-head strong').textContent = isMotorcycle ? '이륜자동차 사용신고필증으로 정보 입력' : '자동차등록증으로 차량 정보 입력';
      var label = block.querySelector('.czw-registration-button span');
      label.firstChild.nodeValue = isMotorcycle ? '사용신고필증 촬영·업로드' : '자동차등록증 촬영·업로드';
    }
    vehicleChoices.forEach(function (button) {
      button.addEventListener('click', syncDocumentCopy);
    });
  }

  function splitMediaUpload(form) {
    var upload = form.querySelector('.czw-upload');
    if (!upload) return;
    var grid = document.createElement('div');
    grid.className = 'czw-media-grid';
    grid.innerHTML =
      '<button type="button" data-image-upload><img src="' + cameraIcon + '" alt=""><span>사진 추가<small>최대 6장 · 장당 5MB</small></span></button>' +
      '<button type="button" data-video-upload><img src="' + videoIcon + '" alt=""><span>영상 추가<small>MP4 · 최대 50MB</small></span></button>';
    upload.replaceWith(grid);
    grid.querySelector('[data-image-upload]').onclick = function () {
      this.classList.toggle('is-ready');
      this.querySelector('span').firstChild.nodeValue = this.classList.contains('is-ready') ? '사진 선택 화면 확인 완료' : '사진 추가';
    };
    grid.querySelector('[data-video-upload]').onclick = function () {
      this.classList.toggle('is-ready');
      this.querySelector('span').firstChild.nodeValue = this.classList.contains('is-ready') ? '영상 선택 화면 확인 완료' : '영상 추가';
    };
  }

  function improveCopy(form) {
    var sections = form.querySelectorAll('.czw-section');
    if (sections[0]) {
      var ownerGuide = sections[0].querySelector('.czw-guide');
      if (ownerGuide) ownerGuide.textContent = '입력한 연락 정보는 공개되지 않으며 사실 확인에만 사용됩니다.';
    }
    if (sections[1]) {
      var vehicleHeading = sections[1].querySelector('h2');
      if (vehicleHeading) vehicleHeading.insertAdjacentHTML('afterend', '<p class="czw-guide">불만을 등록할 차량 정보를 사실대로 입력해 주세요.</p>');
    }
    if (sections[4]) {
      var complaintGuide = sections[4].querySelector('.czw-guide');
      if (complaintGuide) complaintGuide.textContent = '증상, 재현 조건, 판매·정비 업체와의 소통 내용, 평소 정비 이력을 사실대로 자세히 적어 주세요.';
    }
  }

  function strengthenValidationCopy(form) {
    var nativeSubmit = form.onsubmit;
    if (typeof nativeSubmit !== 'function') return;
    form.onsubmit = function (event) {
      nativeSubmit.call(this, event);
      var age = form.elements.age;
      var error = age && age.closest('.czw-field') && age.closest('.czw-field').querySelector('.czw-inline-error');
      if (error && error.textContent) error.textContent = '나이를 입력해 주세요';
    };
  }

  function enhanceWriter() {
    var form = document.querySelector('.czw-form');
    if (!form || form.dataset.tenxEnhanced === 'true') return;
    form.dataset.tenxEnhanced = 'true';
    addRequiredNotice(form);
    replaceAge(form);
    removeOptionalGender(form);
    addRegistrationUpload(form);
    splitMediaUpload(form);
    improveCopy(form);
    addSectionIcons(form);
    strengthenValidationCopy(form);
  }

  window.renderChezhiwangComplaintBoardTable = function () {
    originalRender.apply(this, arguments);
    enhanceWriter();
  };
})();
