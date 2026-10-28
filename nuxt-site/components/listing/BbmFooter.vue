<script setup lang="ts">
// 리액트 bbm-list-area.tsx 의 BbmFooter(원본 app-shell__footer). onNotify(message) → emit("notify", message)
// PC는 사업자 정보·고객센터·링크·SNS·컬러 모드·앱 설치, 모바일은 연락처·바로가기·사업자 정보 접기·링크·SNS·컬러 모드.
// 링크·버튼은 모두 "정식 서비스에서 이용" 안내만 띄운다
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-list-area.css";

const emit = defineEmits<{ notify: [message: string] }>();
const notify = (label: string) => (event: { preventDefault: () => void }) => { event.preventDefault(); emit("notify", `${label}은(는) 정식 서비스에서 이용해 주세요.`); };
const snsItems = [["인스타그램", "footer-instagram"], ["페이스북", "footer-facebook"], ["유튜브", "footer-youtube"], ["스레드", "footer-threads"]] as const;
const pcLinks: Array<[string, string]> = [["회사소개", ""], ["제휴/광고문의", ""], ["이용약관", ""], ["제휴/신고센터", ""], ["고객센터", ""], ["청소년보호정책", ""], ["개인정보취급방침", " app-footer-link--primary"], ["원격지원", " app-footer-link--strong"]];
const mobileLinks: Array<[string, string]> = [["고객센터", ""], ["제휴/광고", ""], ["제안/건의", ""], ["이용관리", ""], ["개인정보처리방침", " app-footer-mobile__link--primary"]];
const divider = bbmIcon("footer-biz-divider");
</script>
<template>
  <footer class="app-shell__footer">
    <div class="app-footer">
      <div class="app-footer__inner">
        <section class="app-footer-top">
          <div class="app-footer-top__left">
            <p class="app-footer-biz-title">(주) 보배네트워크 사업자 정보</p>
            <div class="app-footer-biz-line">
              <span class="app-footer-biz-text">대표이사: 김보배</span><img :src="divider" alt="" class="app-footer-biz-divider" />
              <span class="app-footer-biz-text">사업자등록번호 : 117-81-64543</span>
              <button type="button" class="app-footer-biz-check" @click="notify('사업자정보 확인')($event)">사업자정보 확인</button><img :src="divider" alt="" class="app-footer-biz-divider" />
              <span class="app-footer-biz-text">주소 : (07995) 서울 양천구 목동동로 233-1 드림타워 11, 12층</span>
            </div>
            <div class="app-footer-biz-line">
              <span class="app-footer-biz-text">통신판매업신고번호 : 제2013-서울양천-0465호</span><img :src="divider" alt="" class="app-footer-biz-divider" />
              <span class="app-footer-biz-text">개인정보관리책임자 : 이은호</span>
            </div>
            <div class="app-footer-biz-line">
              <span class="app-footer-biz-text">팩스 : 02-6499-2329</span><img :src="divider" alt="" class="app-footer-biz-divider" />
              <span class="app-footer-biz-text">메일 :</span>
              <a href="#" class="app-footer-biz-mail" @click="notify('메일 보내기')($event)">bobaedream@bobaedream.co.kr</a>
            </div>
            <p class="app-footer-biz-copyright">Copyright © (주)보배네트워크</p>
          </div>
          <div class="app-footer-top__right">
            <p class="app-footer-cs-title">고객센터</p>
            <p class="app-footer-cs-phone">02-784-2329</p>
            <div class="app-footer-cs-hours">
              <p>평일 <span>09:00 - 18:00</span></p>
              <p>점심시간 <span>11:30 - 12:30</span></p>
            </div>
          </div>
        </section>
        <section class="app-footer-bottom">
          <div class="app-footer-bottom__left">
            <div class="app-footer-links">
              <a v-for="[label, extra] in pcLinks" :key="label" href="#" :class="`app-footer-link${extra}`" @click="notify(label)($event)">{{ label }}</a>
            </div>
            <div class="app-footer-sns"><a v-for="[label, icon] in snsItems" :key="label" href="#" class="app-footer-sns__link" :aria-label="label" @click="notify(label)($event)"><img :src="bbmIcon(icon)" alt="" class="app-footer-sns__icon" /></a></div>
          </div>
          <div class="app-footer-bottom__right">
            <div class="app-footer-theme-toggle" aria-label="컬러 모드 선택">
              <button type="button" class="is-active app-footer-theme-toggle__button" aria-pressed="true" aria-label="라이트 모드" @click="notify('컬러 모드')($event)"><img :src="bbmIcon('footer-theme-light')" alt="" class="app-footer-theme-toggle__icon" /></button>
              <button type="button" class="app-footer-theme-toggle__button" aria-pressed="false" aria-label="다크 모드" @click="notify('다크 모드')($event)"><img :src="bbmIcon('footer-theme-dark')" alt="" class="app-footer-theme-toggle__icon" /></button>
            </div>
            <div class="app-footer-app-install">
              <span class="app-footer-app-title">앱 설치</span>
              <img :src="divider" alt="" class="app-footer-app-divider" />
              <div class="app-footer-store">
                <a href="#" class="app-footer-store__link" aria-label="Google Play" @click="notify('Google Play')($event)"><img :src="bbmIcon('footer-google-play')" alt="" class="app-footer-store__icon" /></a>
                <a href="#" class="app-footer-store__link" aria-label="App Store" @click="notify('App Store')($event)"><img :src="bbmIcon('footer-app-store')" alt="" class="app-footer-store__icon" /></a>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div class="app-footer-mobile">
        <div class="app-footer-mobile__contacts">
          <div class="app-footer-mobile__contact-item"><span class="app-footer-mobile__contact-label">이용문의</span><span class="app-footer-mobile__contact-value">02-784-2329</span></div>
          <div class="app-footer-mobile__contact-item"><span class="app-footer-mobile__contact-label">제휴광고</span><span class="app-footer-mobile__contact-value">070-4272-0114</span></div>
        </div>
        <div class="app-footer-mobile__quick-links">
          <a v-for="label in ['로그인', '매물등록', '매물관리', 'PC버전']" :key="label" href="#" class="app-footer-mobile__quick-link" @click="notify(label)($event)">{{ label }}</a>
        </div>
        <details class="app-footer-mobile__biz">
          <summary class="app-footer-mobile__biz-summary">
            <span class="app-footer-mobile__biz-summary-text">(주) 보배네트워크 사업자 정보</span>
            <img :src="bbmIcon('footer-biz-chevron')" alt="" class="app-footer-mobile__biz-chevron" />
          </summary>
          <div class="app-footer-mobile__biz-content">
            <p>대표이사: 김보배</p>
            <p>서울 양천구 목동동로 233-1 드림타워 11,12층</p>
            <p>사업자번호: 117-81-64543</p>
            <p class="app-footer-mobile__biz-email">이메일: bobaedream@bobaedream.co.kr</p>
            <p>팩스: 02-6499-2329</p>
          </div>
        </details>
        <div class="app-footer-mobile__links">
          <a v-for="[label, extra] in mobileLinks" :key="label" href="#" :class="`app-footer-mobile__link${extra}`" @click="notify(label)($event)">{{ label }}</a>
        </div>
        <div class="app-footer-mobile__sns"><a v-for="[label, icon] in snsItems" :key="label" href="#" class="app-footer-mobile__sns-link" :aria-label="label" @click="notify(label)($event)"><img :src="bbmIcon(icon)" alt="" class="app-footer-mobile__sns-icon" /></a></div>
        <div class="app-footer-mobile__theme">
          <div class="app-footer-theme-toggle" aria-label="컬러 모드 선택">
            <button type="button" class="is-active app-footer-theme-toggle__button" aria-pressed="true" aria-label="라이트 모드" @click="notify('컬러 모드')($event)"><img :src="bbmIcon('footer-theme-light')" alt="" class="app-footer-theme-toggle__icon" /></button>
            <button type="button" class="app-footer-theme-toggle__button" aria-pressed="false" aria-label="다크 모드" @click="notify('다크 모드')($event)"><img :src="bbmIcon('footer-theme-dark')" alt="" class="app-footer-theme-toggle__icon" /></button>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
