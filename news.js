// ニュース管理システム
class NewsManager {
    constructor() {
        this.newsData = [];
        this.categories = {};
        this.currentCategory = 'all';
    }

    // ニュースデータの読み込み
    async loadNews() {
        try {
            const response = await fetch('news.json');
            const data = await response.json();
            this.newsData = data.news;
            this.categories = data.categories;
            // 日付順にソート（新しい順）
            this.newsData.sort((a, b) => {
                return new Date(b.date.replace(/\./g, '-')) - new Date(a.date.replace(/\./g, '-'));
            });
            return true;
        } catch (error) {
            console.error('ニュースデータの読み込みに失敗しました:', error);
            return false;
        }
    }

    // カテゴリーでフィルタリング
    filterByCategory(category) {
        this.currentCategory = category;
        return category === 'all' 
            ? this.newsData 
            : this.newsData.filter(item => item.category === category);
    }

    // 最新のニュースを取得
    getLatestNews(count = 6) {
        return this.newsData.slice(0, count);
    }

    // カテゴリ別のラベル色を取得
    getCategoryClass(category) {
        const categoryClasses = {
            'notice': 'category-notice',
            'conference': 'category-conference',
            'award': 'category-award',
            'press': 'category-press'
        };
        return categoryClasses[category] || '';
    }

    // カテゴリ名を取得
    getCategoryName(category) {
        return this.categories[category] || category;
    }

    // ニュースアイテムのHTMLを生成
    generateNewsItemHTML(item) {
        const categoryClass = this.getCategoryClass(item.category);
        const categoryName = this.getCategoryName(item.category);
        const newBadge = item.isNew ? '<span class="new-badge">NEW</span>' : '';
        
        // 画像またはプレースホルダー
        let imageHTML = '';
        if (item.image) {
            imageHTML = `<img src="${item.image}" alt="${item.imageAlt || item.title}" class="news-image">`;
        } else {
            // カテゴリに応じた背景グラデーション
            const gradients = {
                'press': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                'conference': 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                'award': 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                'notice': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
            };
            const gradient = gradients[item.category] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            imageHTML = `<div class="news-image-placeholder" style="background: ${gradient};">
                <div>${item.imageAlt || categoryName}</div>
            </div>`;
        }

        return `
            <div class="news-item" data-category="${item.category}">
                ${imageHTML}
                <div class="news-body">
                    <div class="news-date">${item.date} ${newBadge}</div>
                    <h3 class="news-title">${item.title}</h3>
                    <span class="news-category ${categoryClass}">${categoryName}</span>
                    ${item.description ? `<p class="news-description">${item.description}</p>` : ''}
                    ${item.link && item.link !== '#' ? `<a href="${item.link}" class="news-link">詳細を見る</a>` : ''}
                </div>
            </div>
        `;
    }

    // ニュース一覧ページ用：タブメニューのHTMLを生成
    generateTabsHTML() {
        let html = '<div class="news-tabs">';
        for (const [key, value] of Object.entries(this.categories)) {
            const activeClass = this.currentCategory === key ? 'active' : '';
            html += `<button class="news-tab ${activeClass}" data-category="${key}" onclick="newsManager.switchCategory('${key}')">${value}</button>`;
        }
        html += '</div>';
        return html;
    }

    // カテゴリ切り替え
    async switchCategory(category) {
        this.currentCategory = category;
        await this.displayNews();
        
        // タブのアクティブ状態を更新
        document.querySelectorAll('.news-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
    }

    // ニュース一覧を表示（Newsページ用）
    async displayNews() {
        const container = document.getElementById('news-list');
        if (!container) return;

        const filteredNews = this.filterByCategory(this.currentCategory);
        
        if (filteredNews.length === 0) {
            container.innerHTML = '<p class="no-news">ニュースがありません。</p>';
            return;
        }

        container.innerHTML = filteredNews.map(item => this.generateNewsItemHTML(item)).join('');
    }

    // 最新ニュースを表示（Topページ用）
    async displayLatestNews(containerId = 'latest-news', count = 6) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const latestNews = this.getLatestNews(count);
        
        // Topページ用の簡略版HTML
        const simpleNewsHTML = latestNews.map(item => {
            const categoryClass = this.getCategoryClass(item.category);
            const categoryName = this.getCategoryName(item.category);
            
            return `
                <div class="news-item">
                    <div class="news-date">${item.date}</div>
                    <div>
                        <span class="news-category ${categoryClass}">${categoryName}</span><br>
                        ${item.title}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="news-list">${simpleNewsHTML}</div>`;
    }

    // 初期化
    async init(pageType = 'news') {
        const loaded = await this.loadNews();
        if (!loaded) return;

        if (pageType === 'news') {
            // タブメニューを表示
            const tabContainer = document.getElementById('news-tabs-container');
            if (tabContainer) {
                tabContainer.innerHTML = this.generateTabsHTML();
            }
            // ニュース一覧を表示
            await this.displayNews();
        } else if (pageType === 'top') {
            // Topページ用の最新ニュース表示
            await this.displayLatestNews();
        }
    }
}

// グローバルインスタンスを作成
const newsManager = new NewsManager();

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    // 現在のページを判定
    const isNewsPage = window.location.pathname.includes('news.html');
    const isTopPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
    
    if (isNewsPage) {
        newsManager.init('news');
    } else if (isTopPage) {
        newsManager.init('top');
    }
});