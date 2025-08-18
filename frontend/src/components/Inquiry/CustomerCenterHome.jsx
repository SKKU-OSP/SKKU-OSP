
import { Link } from 'react-router-dom';
import './CustomerCenterHome.css';

function CustomerCenterHome() {
    const guidePath = '/images/guide_icon_green.png';
    const faqPath = '/images/faq_icon_green.png';
    const inquiryPath = '/images/inquiry_icon_green.png';

    return (
        <div className="customer-center-container">
            <div className="customer-center-row">
                    <a href="https://equinox-rule-857.notion.site/SOSD-User-Manual-4283b4cc583e47298a42470a11be1c42" target="_blank" rel="noopener noreferrer" className="customer-center-button">
                    <img src={guidePath} alt="User Guide" className="customer-center-icon" />
                    <span className="customer-center-text">사용자 가이드</span>
                </a>
            </div>
            <div className="customer-center-row">
                <Link to="/inquiry/faq" className="customer-center-button">
                    <img src={faqPath} alt="FAQ" className="customer-center-icon" />
                    <span className="customer-center-text">자주 묻는 질문</span>
                </Link>
            </div>
            <div className="customer-center-row">
                <Link to="/inquiry/board" className="customer-center-button">
                    <img src={inquiryPath} alt="Inquiry Board" className="customer-center-icon" />
                    <span className="customer-center-text">문의게시판</span>
                </Link>
            </div>
        </div>
    );
}

export default CustomerCenterHome;
