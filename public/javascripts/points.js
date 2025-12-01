async function addPointsAPI(actionType, points, targetId = null) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;

        const res = await fetch("/api/points/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ actionType, points, targetId })
        });

        const data = await res.json();
        return data.success || false;

    } catch (err) {
        console.error("❌ Błąd API addPoints:", err);
        return false;
    }
}
