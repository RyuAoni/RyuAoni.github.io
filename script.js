// =================================================================
// ページの読み込みが完了したら、すべての処理を開始する
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- UI関連の処理を初期化 ---
    setupUIEventListeners();

    // --- ページに応じて、適切なデータ読み込み処理を実行 ---
    
    // ホームページ用のニュース表示（最新3件）
    if (document.getElementById('home-news-grid')) {
        loadNews(3); // 3件だけ読み込む
    }
    // ニュース一覧ページ用のニュース表示（全件）
    if (document.getElementById('all-news-grid')) {
        loadNews(); // 件数指定なしで全件読み込む
    }
    // ニュース詳細ページ用の記事表示
    if (document.getElementById('article-content')) {
        loadArticle();
    }
});


// =================================================================
// 共通のヘルパー関数
// =================================================================

/**
 * CSVテキストをJSONオブジェクトの配列に変換する
 * @param {string} csv - CSV形式のテキストデータ
 * @returns {Array<Object>} - 変換されたオブジェクトの配列
 */
function csvToJSON(csv) {
    const lines = csv.replace(/\r/g, '').split('\n');
    const result = [];
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i] || lines[i].trim() === '') continue;
        const obj = {};
        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        
        if (headers.length !== values.length) {
            console.warn('CSVの列数がヘッダーと一致しません。行番号:', i + 1, '内容:', lines[i]);
            continue;
        }
        
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j].trim();
            let value = values[j] ? values[j].trim() : "";
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            obj[header] = value;
        }
        result.push(obj);
    }
    return result;
}


// =================================================================
// ニュースデータ読み込み関連の処理
// =================================================================

/**
 * ニュースを読み込み、グリッドに表示する
 * @param {number} [limit] - 表示するニュースの最大件数。指定しない場合は全件表示。
 */
async function loadNews(limit) {
    const gridId = limit ? 'home-news-grid' : 'all-news-grid';
    const newsGrid = document.getElementById(gridId);
    if (!newsGrid) return;

    try {
        const response = await fetch('news_data.csv');
        const csvData = await response.text();
        const articles = csvToJSON(csvData);

        // ▼▼▼ この行を変更しました ▼▼▼
        // IDの大きい順（降順）にソート
        articles.sort((a, b) => Number(b.id) - Number(a.id));

        const itemsToDisplay = limit ? articles.slice(0, limit) : articles;

        newsGrid.innerHTML = ''; // 既存の内容をクリア

        if (itemsToDisplay.length === 0) {
            newsGrid.innerHTML = '<p style="color: #E0E0E0;">最新情報はありません。</p>';
            return;
        }

        itemsToDisplay.forEach(article => {
            const excerpt = article.content.replace(/<br>/g, ' ').substring(0, 50) + '...';
            const card = document.createElement('article');
            card.className = 'news-card';
            card.innerHTML = `
                <a href="article.html?id=${article.id}" class="news-card-link">
                    <div class="news-date">${article.date}</div>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-excerpt">${excerpt}</p>
                </a>
            `;
            newsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('ニュースの読み込みに失敗しました:', error);
        newsGrid.innerHTML = '<p style="color: #E0E0E0;">ニュースの読み込みに失敗しました。</p>';
    }
}

/**
 * URLのIDに基づいて単一の記事を読み込み、表示する
 */
async function loadArticle() {
    const contentDiv = document.getElementById('article-content');
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    if (!articleId) {
        contentDiv.innerHTML = '<div class="article-container"><h1>記事が指定されていません。</h1></div>';
        return;
    }

    try {
        const response = await fetch('news_data.csv');
        const csvData = await response.text();
        const articles = csvToJSON(csvData);
        const article = articles.find(a => a.id === articleId);

        if (article) {
            document.title = `${article.title} - 共創`;
            contentDiv.innerHTML = `
                <div class="article-container">
                    <div class="article-header">
                        <div class="news-date">${article.date}</div>
                        <h1 class="article-title">${article.title}</h1>
                    </div>
                    <div class="section-divider" style="margin: 2rem 0;"></div>
                    <div class="article-body">
                        <p>${article.content}</p>
                    </div>
                    <a href="news.html" class="more-btn" style="margin-top: 3rem;">一覧へ戻る</a>
                </div>
            `;
        } else {
            contentDiv.innerHTML = '<div class="article-container"><h1>記事が見つかりませんでした。</h1></div>';
        }
    } catch (error) {
        console.error('記事の読み込みに失敗しました:', error);
        contentDiv.innerHTML = '<div class="article-container"><h1>記事の読み込みに失敗しました。</h1></div>';
    }
}


// =================================================================
// UI関連の処理
// =================================================================

function setupUIEventListeners() {
    // --- ハンバーガーメニューの制御 ---
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const body = document.body;

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
        });

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
                body.style.overflow = 'auto';
            });
        });

        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
                body.style.overflow = 'auto';
            }
        });
    }

    // --- スクロール時のヘッダー背景変化 ---
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (header) {
            header.style.background = (window.scrollY > 100)
                ? 'linear-gradient(135deg, #1C1C1C 0%, rgba(28, 28, 28, 0.98) 100%)'
                : 'linear-gradient(135deg, #1C1C1C 0%, rgba(28, 28, 28, 0.95) 100%)';
        }
    });

    // --- スムーズスクロール ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}
