import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import 'grapesjs-preset-webpage';
import { io } from 'socket.io-client';

export default function GrapesEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const requestedId = pathParts[1];

  // Redirigir a room aleatorio de 6 dígitos si no hay ID en la URL
  useEffect(() => {
    if (!requestedId) {
      const randomRoomId = Math.floor(100000 + Math.random() * 900000).toString();
      navigate(`/Lienzo/${randomRoomId}`, { replace: true });
    }
  }, [requestedId, navigate]);

  const roomId = requestedId;
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current) return;

    let zIndexCounter = 10;

    const socket = io('http://localhost:4000');
    socket.emit('join-room', roomId);

    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .gjs-cv-canvas {
        background-image: 
          linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
        background-size: 20px 20px;
      }
      .editable-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 0.375rem;
      }
      .editable-button span {
        flex: 1;
        text-align: center;
        line-height: 1.2;
      }
    `;
    document.head.appendChild(styleEl);

    const editor = grapesjs.init({
      container: '#gjs',
      fromElement: true,
      height: '100vh',
      width: 'auto',
      storageManager: false,
      plugins: ['gjs-preset-webpage'],
      pluginsOpts: { 'gjs-preset-webpage': { blocks: [] } },
      blockManager: { appendTo: '#blocks' },
      canvas: { dragMode: 'absolute', useIframe: false },
      assetManager: {
        appendTo: 'body',
        modal: { title: 'Selecciona una imagen' },
        input: true,
        upload: false,
        assets: [],
      },
    });
    editorRef.current = editor;

        // Inicializar con contenido base en el lienzo
    editor.setComponents('<div class="page"><h1>¡Empieza tu diseño aquí!</h1></div>');
    // El estilo del wrapper ya está aplicado más arriba via wrapper.setStyle
    // Aseguramos que la clase .page siempre ocupe pantalla
    const pageStyle = document.createElement('style');
    pageStyle.innerHTML = `#gjs .page { min-height: 100vh; background-color: #ffffff; }`;
    document.head.appendChild(pageStyle);
    (window as any).editor = editor;

    editor.on('component:add', (model: any) => {
      model.set({ draggable: true, copyable: false });
      if (typeof model.setDragMode === 'function') model.setDragMode('absolute');
      const style = model.getStyle();
      model.setStyle({
        ...style,
        position: 'absolute',
        top: style.top || '10px',
        left: style.left || '10px',
        zIndex: zIndexCounter++,
      });
    });

    const wrapper = editor.getWrapper();
    wrapper.set({ droppable: true });
    wrapper.setStyle({
      position: 'relative',
      width: '100%',
      height: '100vh',
      backgroundColor: 'var(--color-block-bg)',
    });

    editor.DomComponents.addType('editable-box', {
      isComponent: (el: HTMLElement) => el.tagName === 'DIV' && el.classList.contains('editable-box'),
      model: {
        defaults: {
          tagName: 'div',
          attributes: { class: 'editable-box' },
          draggable: true,
          copyable: false,
          droppable: false,
          stylable: true,
          components: [
            { tagName: 'span', type: 'text', content: 'Tarjeta libre editable', editable: true },
          ],
          style: {
            position: 'absolute',
            top: '100px',
            left: '100px',
            width: '120px',
            height: '80px',
            background: 'rgb(128, 128, 128)',
            color: 'white',
            display: 'inline-block',
            padding: '10px',
            resize: 'both',
            overflow: 'auto',
            border: '2px dashed #2196F3',
            cursor: 'text',
          },
        },
      },
    });

    editor.DomComponents.addType('editable-button', {
      isComponent: (el: HTMLElement) => el.tagName === 'BUTTON' && el.classList.contains('editable-button'),
      model: {
        defaults: {
          tagName: 'button',
          attributes: { class: 'editable-button' },
          draggable: true,
          copyable: false,
          droppable: false,
          stylable: true,
          components: [{ tagName: 'span', type: 'text', content: 'Texto del Botón', editable: true }],
          style: {
            position: 'absolute',
            top: '400px',
            left: '250px',
            width: '120px',
            height: '40px',
            display: 'inline-block',
            resize: 'both',
            overflow: 'auto',
            fontSize: '14px',
            border: '1px solid #999',
            cursor: 'text',
          },
        },
      },
    });

    const blocks = [
      { id: 'free-box', label: 'Tarjeta', category: 'Elementos:', content: { type: 'editable-box' } },
      {
        id: 'text',
        label: 'Texto',
        category: 'Elementos:',
        content: {
          type: 'text',
          content: 'Texto editable',
          draggable: true,
          copyable: false,
          droppable: false,
          style: {
            position: 'absolute',
            top: '200px',
            left: '150px',
            width: '150px',
            height: 'auto',
            fontSize: '16px',
            padding: '5px',
            border: '1px dashed #ccc',
            cursor: 'text',
            resize: 'both',
            overflow: 'auto',
          },
        },
      },
      { id: 'button', label: 'Botón', category: 'Elementos:', content: { type: 'editable-button' } },
      {
        id: 'input-box',
        label: 'Input Box',
        category: 'Elementos:',
        content: `<input type="text" placeholder="Escribe aquí..." class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" style="position:absolute; top:250px; left:200px; border-radius: 7px;" />`,
      },
    ];
    blocks.forEach((block) => {
      if (!editor.BlockManager.get(block.id)) editor.BlockManager.add(block.id, block);
    });

    editor.BlockManager.add('image', {
      id: 'image',
      label: 'Subir Imagen',
      category: 'Elementos:',
      content: () => {
        const am = editor.AssetManager;
        am.open({
          select: (asset: any) => {
            const src = asset.get('src');
            const imageComponent = editor.DomComponents.addComponent({
              tagName: 'img',
              attributes: { src, alt: 'imagen subida' },
              style: {
                position: 'absolute',
                top: '300px',
                left: '200px',
                width: '200px',
                height: '150px',
                border: '1px solid #ddd',
                resize: 'both',
                overflow: 'auto',
              },
            });
            editor.select(imageComponent);
          },
        });
      },
    });

    // -------------------- WebSocket sincronización de proyecto --------------------
    editor.on('component:update', () => {
      const projectData = {
        components: editor.getComponents(),
        styles: editor.getStyle(),
      };
      socket.emit('editor-update', projectData);
    });

    socket.on('load-project', (data) => {
  if (data && data.components && data.components.length > 0) {
    editor.setComponents(data.components);
    editor.setStyle(data.styles);
  } else {
    editor.setComponents('<h1>¡Bienvenido a tu nuevo lienzo!</h1>');
    editor.setStyle({ body: { backgroundColor: '#ffffff', padding: '20px' } });
  }
});

    socket.on('editor-update', (data) => {
      if (data) {
        editor.setComponents(data.components);
        editor.setStyle(data.styles);
      }
    });
  }, []);

  return (
    <div className="flex w-screen h-screen">
      <div className="w-64 text-white p-2 overflow-y-auto" style={{ backgroundColor: 'var(--color-sidebar-bg)' }}>
        <div id="blocks"></div>
      </div>
      <div id="gjs" className="flex-grow relative overflow-auto">
        <div className="page min-h-screen">
          <h1 className="relative">¡Empieza tu diseño aquí!</h1>
        </div>
      </div>
    </div>
  );
}
