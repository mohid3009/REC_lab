import { Type, AlignLeft, Hash, PenTool, Calendar, SquareCheck } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

const Sidebar: React.FC = () => {
    const { addField, currentTemplate, activePage, setTemplate, scale, setSelectedFieldIds } = useStore();

    const handleAddField = (type: string) => {
        if (!currentTemplate) return;

        // Find the scroll container and active page element
        const container = document.querySelector('.editor-scroll-container');
        const pageEl = document.querySelector(`[data-page="${activePage}"]`);

        let targetX = 50;
        let targetY = 50;

        if (container && pageEl) {
            const containerRect = container.getBoundingClientRect();
            const pageRect = pageEl.getBoundingClientRect();

            // Calculate center of visible part of the page
            const visibleTop = Math.max(containerRect.top, pageRect.top);
            const visibleBottom = Math.min(containerRect.bottom, pageRect.bottom);
            const visibleLeft = Math.max(containerRect.left, pageRect.left);
            const visibleRight = Math.min(containerRect.right, pageRect.right);

            const centerX = (visibleLeft + visibleRight) / 2;
            const centerY = (visibleTop + visibleBottom) / 2;

            // Convert to relative coordinates within the page, accounting for scale
            targetX = (centerX - pageRect.left) / scale;
            targetY = (centerY - pageRect.top) / scale;

            // If the visible area is very small or off-page, fallback to a safe margin
            if (targetY < 20) targetY = 50;
            if (targetX < 20) targetX = 50;
        }

        const newId = uuidv4();
        const fieldWidth = type === 'checkbox' ? 24 : 150;
        const fieldHeight = type === 'checkbox' ? 24 : 32;

        addField({
            id: newId,
            type: type as any,
            page: activePage,
            x: targetX - (fieldWidth / 2),
            y: targetY - (fieldHeight / 2),
            width: fieldWidth,
            height: fieldHeight,
            label: `New ${type}`,
            required: false,
        });

        // Auto select the new field
        setSelectedFieldIds([newId]);
    };

    const tools = [
        { type: 'text', label: 'Single Line Text', icon: Type, shortcut: 'T' },
        { type: 'multiline', label: 'Paragraph Text', icon: AlignLeft, shortcut: 'A' },
        { type: 'number', label: 'Number', icon: Hash, shortcut: 'N' },
        { type: 'date', label: 'Date', icon: Calendar, shortcut: 'D' },
        { type: 'checkbox', label: 'Checkbox', icon: SquareCheck, shortcut: 'C' },
        { type: 'signature', label: 'Signature', icon: PenTool, shortcut: 'S' },
    ];

    return (
        <div className="p-4 flex flex-col h-full">
            <h2 className="text-lg font-serif font-bold text-ink mb-4">Form Fields</h2>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {tools.map((tool) => (
                    <button
                        key={tool.type}
                        onClick={() => handleAddField(tool.type)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-accent hover:bg-accent/5 transition-all text-left group shadow-sm active:scale-95"
                    >
                        <div className="flex items-center space-x-3">
                            <tool.icon className="w-5 h-5 text-accent" />
                            <span className="font-medium text-ink text-sm">{tool.label}</span>
                        </div>
                        {tool.shortcut && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded border border-accent/20 font-mono font-bold">
                                {tool.shortcut}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col space-y-3">
                <button
                    onClick={async () => {
                        if (!currentTemplate) return;
                        try {
                            const mappedFields = useStore.getState().fields.map(({ id, ...rest }) => ({
                                fieldId: id,
                                ...rest
                            }));
                            const response = await fetch(`/api/templates/${currentTemplate._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: currentTemplate.title,
                                    fields: mappedFields
                                })
                            });

                            if (!response.ok) throw new Error('Save failed');
                            const updatedData = await response.json();
                            setTemplate(updatedData);
                            alert('Saved!');
                        } catch (e) {
                            alert('Save failed');
                        }
                    }}
                    className="w-full py-2 px-4 rounded border border-gray-300 text-ink font-medium hover:bg-gray-50"
                >
                    Save Draft
                </button>

                <button
                    onClick={async () => {
                        if (!currentTemplate) return;
                        if (!confirm('Publishing will lock the design. Continue?')) return;

                        try {
                            const mappedFields = useStore.getState().fields.map(({ id, ...rest }) => ({
                                fieldId: id,
                                ...rest
                            }));
                            const response = await fetch(`/api/templates/${currentTemplate._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: currentTemplate.title,
                                    fields: mappedFields,
                                    isPublished: true
                                })
                            });

                            if (!response.ok) throw new Error('Publish failed');
                            const updatedData = await response.json();

                            alert('Published! This template is now ready for use.');
                            setTemplate(updatedData);
                        } catch (e) {
                            console.error('Publish error:', e);
                            alert('Publish failed');
                        }
                    }}
                    className="w-full py-2 px-4 rounded bg-ink text-white font-medium hover:bg-black transition-colors shadow-lg"
                >
                    Publish Template
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
