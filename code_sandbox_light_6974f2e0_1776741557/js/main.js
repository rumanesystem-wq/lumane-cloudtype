/* ============================================
   케이트블랑 드레스룸 — JavaScript
   ============================================ */

// ── 페이지 전환 ────────────────────────────────
function showPage(pageId) {
  // 모든 페이지 숨기기
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // 해당 페이지 보이기
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  // 네비 활성 상태 업데이트
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // 스크롤 상단으로
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ── 모바일 메뉴 ────────────────────────────────
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger');
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  btn.classList.toggle('open', !isOpen);
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}


// ── 헤더 스크롤 효과 ───────────────────────────
window.addEventListener('scroll', () => {
  const header = document.getElementById('site-header');
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }
});


// ── FAQ 아코디언 ───────────────────────────────
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');

  // 모든 FAQ 닫기
  document.querySelectorAll('.faq-q').forEach(q => {
    q.classList.remove('open');
    if (q.nextElementSibling) {
      q.nextElementSibling.classList.remove('open');
    }
  });

  // 클릭한 항목이 닫혀있었으면 열기
  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
  }
}


// ── 선반 색상 직접 입력 ────────────────────────
function handleShelfColorChange(select) {
  const customWrap = document.getElementById('shelf-color-custom-wrap');
  if (customWrap) {
    customWrap.style.display = select.value === '기타' ? 'block' : 'none';
  }
}


// ── 파일 첨부 처리 ────────────────────────────
// 선택된 파일을 전역으로 저장
window._selectedFile = null;

// HTML onchange에서 직접 호출 (인라인 + addEventListener 이중 등록)
function onFileSelected(input) {
  const label   = document.getElementById('file-label');
  const preview = document.getElementById('file-preview-wrap');
  const img     = document.getElementById('file-preview-img');

  if (input && input.files && input.files.length > 0) {
    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기가 5MB를 초과합니다.');
      input.value = '';
      window._selectedFile = null;
      if (label) { label.textContent = '클릭하여 사진을 첨부하세요'; label.style.color = ''; }
      if (preview) preview.style.display = 'none';
      return;
    }

    window._selectedFile = file;
    console.log('[파일선택] ✅', file.name, Math.round(file.size/1024) + 'KB', '| _selectedFile 저장됨');

    if (label) { label.textContent = file.name; label.style.color = 'var(--gold-dark)'; }

    if (preview && img) {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(file);
    }
  } else {
    window._selectedFile = null;
    if (label) { label.textContent = '클릭하여 사진을 첨부하세요'; label.style.color = ''; }
    if (preview) preview.style.display = 'none';
  }
}

// DOMContentLoaded에서도 addEventListener로 이중 등록
function initFileUpload() {
  const input = document.getElementById('q-file');
  if (!input) { console.warn('[파일업로드] q-file 요소 없음'); return; }
  input.addEventListener('change', function() { onFileSelected(this); });
  console.log('[파일업로드] addEventListener 등록 완료');
}

function handleFileChange(input) { onFileSelected(input); } // 하위호환

// 파일 → base64 변환 (Promise)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 이미지 압축 후 base64 반환 — 최대 800px / 품질 0.6
async function compressImage(file) {
  const steps = [
    { px: 800, q: 0.6 },
    { px: 600, q: 0.5 },
    { px: 400, q: 0.4 },
  ];
  for (const { px, q } of steps) {
    const result = await _resizeAndEncode(file, px, q);
    console.log(`[압축] ${px}px / q${q} → ${Math.round(result.length / 1024)}KB`);
    return result; // 첫 단계 결과를 바로 반환 (청크로 분할하므로 크기 제한 불필요)
  }
  return await _resizeAndEncode(file, 400, 0.4);
}

// base64 문자열을 청크 배열로 분할 (각 청크 20KB 이하)
function splitIntoChunks(base64str, chunkSize = 20000) {
  const chunks = [];
  for (let i = 0; i < base64str.length; i += chunkSize) {
    chunks.push(base64str.slice(i, i + chunkSize));
  }
  return chunks;
}

// 청크 배열을 quote_photos 테이블에 순서대로 저장
async function savePhotoChunks(quoteId, fileName, base64str) {
  const chunks = splitIntoChunks(base64str, 20000);
  console.log(`[사진] 총 ${chunks.length}개 청크로 분할 | 전체 크기: ${Math.round(base64str.length / 1024)}KB`);

  for (let i = 0; i < chunks.length; i++) {
    console.log(`[사진] 청크 ${i + 1}/${chunks.length} 저장 중...`);
    const res = await fetch(apiUrl('tables/quote_photos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quote_id:    quoteId,
        file_name:   fileName,
        chunk_index: i,
        chunk_total: chunks.length,
        chunk_data:  chunks[i]
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`청크 ${i + 1} 저장 실패: ${res.status} — ${txt.slice(0, 100)}`);
    }
    const saved = await res.json();
    console.log(`[사진] 청크 ${i + 1} 저장 완료 | id: ${saved.id}`);
  }
  console.log(`✅ 사진 전체 저장 완료 (${chunks.length}개 청크)`);
}

function _resizeAndEncode(file, maxPx, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else       { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}


// ── 개인정보 상세 토글 ─────────────────────────
function togglePrivacy() {
  const detail = document.getElementById('privacy-detail');
  const icon   = document.getElementById('privacy-icon');
  const isOpen = detail.style.display !== 'none';
  detail.style.display = isOpen ? 'none' : 'block';
  if (icon) {
    icon.style.transform = isOpen ? '' : 'rotate(180deg)';
  }
}


// ── 폼 유효성 검사 ─────────────────────────────
function validateQuoteForm() {
  let valid = true;
  const clearError = id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; }
  };
  const setError = (id, msg) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; }
    valid = false;
  };

  // 이름
  clearError('err-name');
  const name = document.getElementById('q-name').value.trim();
  if (!name) setError('err-name', '이름을 입력해 주세요.');

  // 연락처
  clearError('err-phone');
  const phone = document.getElementById('q-phone').value.trim();
  if (!phone) {
    setError('err-phone', '연락처를 입력해 주세요.');
  } else if (!/^[\d\-+]{9,15}$/.test(phone.replace(/\s/g, ''))) {
    setError('err-phone', '올바른 연락처 형식으로 입력해 주세요. (예: 010-0000-0000)');
  }

  // 지역
  clearError('err-region');
  const region = document.getElementById('q-region').value.trim();
  if (!region) setError('err-region', '설치 지역을 입력해 주세요.');

  // 가로
  clearError('err-width');
  const width = document.getElementById('q-width').value;
  if (!width) setError('err-width', '가로 사이즈를 입력해 주세요.');

  // 세로
  clearError('err-depth');
  const depth = document.getElementById('q-depth').value;
  if (!depth) setError('err-depth', '세로 사이즈를 입력해 주세요.');

  // 높이
  clearError('err-height');
  const height = document.getElementById('q-height').value;
  if (!height) setError('err-height', '높이 사이즈를 입력해 주세요.');

  // 형태 (복수 체크박스)
  clearError('err-layout');
  const layouts = document.querySelectorAll('input[name="layout_type"]:checked');
  if (layouts.length === 0) setError('err-layout', '원하는 형태를 하나 이상 선택해 주세요.');

  // 개인정보 동의
  clearError('err-privacy');
  const privacy = document.getElementById('q-privacy').checked;
  if (!privacy) setError('err-privacy', '개인정보 수집·이용에 동의해 주세요.');

  return valid;
}


// ── 견적 폼 제출 ───────────────────────────────

// API URL 계산 — location.origin 기반 절대경로
function apiUrl(path) {
  return location.origin + '/' + path;
}

console.log('[API BASE]', location.origin + '/');

// 웹훅 URL 설정 (필요 시 아래 URL을 실제 엔드포인트로 변경하세요)
const QUOTE_WEBHOOK_URL = '';  // 예: 'https://hooks.zapier.com/hooks/catch/xxxxx'

async function callWebhook(data) {
  if (!QUOTE_WEBHOOK_URL) return; // URL 미설정 시 스킵
  try {
    await fetch(QUOTE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.warn('웹훅 호출 실패 (무시됨):', e.message);
  }
}

async function submitQuote(event) {
  event.preventDefault();

  if (!validateQuoteForm()) {
    const firstError = document.querySelector('.field-error:not(:empty)');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 제출 중...';

  try {
    // ── 1. 전역에 저장된 파일 읽기 ────────────────
    let fileData = '';
    let fileName = '';
    const file = window._selectedFile;
    if (file) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 사진 처리 중...';
      fileData = await compressImage(file);
      fileName = file.name;
      console.log(`[사진] 원본: ${Math.round(file.size/1024)}KB → 압축 후: ${Math.round(fileData.length/1024)}KB`);
    } else {
      console.log('[사진] 첨부 없음');
    }

    // ── 2. 텍스트 데이터 수집 ──────────────────────
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 제출 중...';
    const selectedOptions = Array.from(
      document.querySelectorAll('input[name="options"]:checked')
    ).map(cb => cb.value);

    let shelfColor = document.getElementById('q-shelf-color').value;
    if (shelfColor === '기타') {
      const custom = document.getElementById('q-shelf-color-custom').value.trim();
      shelfColor = custom ? `기타(${custom})` : '기타';
    }

    // ── 3. 텍스트 데이터 먼저 저장 ─────────────────
    const textPayload = {
      name:           document.getElementById('q-name').value.trim(),
      phone:          document.getElementById('q-phone').value.trim(),
      region:         document.getElementById('q-region').value.trim(),
      width:          parseFloat(document.getElementById('q-width').value) || 0,
      depth:          parseFloat(document.getElementById('q-depth').value) || 0,
      height:         parseFloat(document.getElementById('q-height').value) || 0,
      layout_type:    Array.from(document.querySelectorAll('input[name="layout_type"]:checked')).map(el => el.value).join(', ') || '',
      options:        selectedOptions,
      frame_color:    document.getElementById('q-frame-color').value || '',
      shelf_color:    shelfColor || '',
      request_memo:   document.getElementById('q-memo').value.trim(),
      privacy_agreed: true,
      status:         '접수',
      file_name:      fileName || '',
      has_photo:      fileName ? '사진있음' : ''
    };

    console.log('[제출] 텍스트 저장 시작...');
    const res = await fetch(apiUrl('tables/quote_requests'), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(textPayload)
    });

    const resText = await res.text();
    console.log(`[제출] POST 응답: ${res.status} | ${resText.slice(0, 200)}`);
    if (!res.ok) throw new Error(`텍스트 저장 실패: ${res.status} — ${resText}`);

    const savedRecord = JSON.parse(resText);
    console.log(`✅ 텍스트 저장 완료 | id: ${savedRecord.id}`);

    // ── 4. 사진이 있으면 청크로 분할해서 quote_photos 테이블에 저장 ──
    if (fileData && fileName) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 사진 저장 중...';
      try {
        await savePhotoChunks(savedRecord.id, fileName, fileData);
      } catch (photoErr) {
        console.error(`❌ 사진 저장 오류 (텍스트는 저장됨):`, photoErr.message);
      }
    }

    // ── 5. 웹훅 호출 ──────────────────────────────
    callWebhook({
      event:        'new_quote_request',
      submitted_at: new Date().toISOString(),
      record_id:    savedRecord.id,
      ...textPayload,
      file_data:    fileName ? '(사진 첨부됨)' : '',
      options:      selectedOptions.join(', ')
    });

    // ── 6. 성공 화면 표시 ─────────────────────────
    document.getElementById('quote-form').style.display = 'none';
    const successEl = document.getElementById('quote-success');
    successEl.classList.add('show');
    successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('❌ 견적 제출 오류:', err);
    alert('제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.\n' + err.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 견적요청 보내기';
  }
}


// ── 폼 초기화 ─────────────────────────────────
function resetQuoteForm() {
  const form = document.getElementById('quote-form');
  const success = document.getElementById('quote-success');

  if (form) {
    form.reset();
    form.style.display = 'block';
    // 제출 버튼 복구
    const btn = document.getElementById('submit-btn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> 견적요청 보내기';
    }
    // 에러 메시지 초기화
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    // 선반 직접 입력 숨기기
    const customWrap = document.getElementById('shelf-color-custom-wrap');
    if (customWrap) customWrap.style.display = 'none';
    // 파일 초기화
    window._selectedFile = null;
    const fileLabel = document.getElementById('file-label');
    if (fileLabel) { fileLabel.textContent = '클릭하여 사진을 첨부하세요'; fileLabel.style.color = ''; }
    const previewWrap = document.getElementById('file-preview-wrap');
    if (previewWrap) previewWrap.style.display = 'none';
    const fileInput = document.getElementById('q-file');
    if (fileInput) fileInput.value = '';
  }
  if (success) success.classList.remove('show');
}


// ── 연락처 자동 포맷팅 ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const phoneInput = document.getElementById('q-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      let val = this.value.replace(/\D/g, '');
      if (val.length <= 3) {
        this.value = val;
      } else if (val.length <= 7) {
        this.value = val.slice(0,3) + '-' + val.slice(3);
      } else if (val.length <= 11) {
        this.value = val.slice(0,3) + '-' + val.slice(3,7) + '-' + val.slice(7);
      } else {
        this.value = val.slice(0,3) + '-' + val.slice(3,7) + '-' + val.slice(7,11);
      }
    });
  }

  // 파일 업로드 이벤트 등록
  initFileUpload();
});
