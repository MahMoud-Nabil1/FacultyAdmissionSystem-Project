import React from "react";

const GroupPanel: React.FC = () => {
    return (
        <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            minHeight: "200px"
        }}>
            <h1 style={{
                margin: "0 0 20px 0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#333"
            }}>
                اضافة مجموعات
            </h1>
        </div>
    );
};

export default GroupPanel;