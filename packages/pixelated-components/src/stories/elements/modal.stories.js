import React, { useState } from 'react';
import { Callout } from "@/components/structure/callout";
import { Modal, handleModalOpen } from "@/components/elements/modal";
import { LoremIpsum } from "@/components/integrations/loremipsum";

export default {
	title: 'General/Modal',
	component: Modal,
	argTypes: {
		variant: {
			control: 'select',
			options: ['modal', 'dialog', 'popover'],
		},
		isOpen: {
			control: 'boolean',
		},
		modalID: {
			control: 'text',
		},
	},
};

const PageModal = () => {
	const [modalContent, setModalContent] = useState(<></>);
	const handleImageClick = (event, url) => {
		const myContent = <img src={url} title="Modal Image" alt="Modal Image" />;
		setModalContent(myContent);
		handleModalOpen(event);
  	};
	return (
		<>
        	<div className="row-4col">
				<div className="grid-item">
					<Callout
						url="https://farm66.static.flickr.com/65535/50797219348_a7f5b18dd5_b.jpg"
						img="https://www.pixelvivid.com/images/customs/black-white-splatter.jpg"
						imgClick={handleImageClick}
						imgShape="squircle"
						imgAlt="Black White Splatter" />
				</div>
			</div>
			<Modal modalContent={modalContent} />
		</>
	);
};

export const ModalPopup = () => <PageModal />;

export const Playground = (args) => (
	<>
		<main>
			<h1>Modal playground page</h1>
			<p>Five chapters of page content remain behind the active presentation variant.</p>
			<LoremIpsum paragraphs={15} seed="modal-playground" />
		</main>
		<Modal
			{...args}
			modalContent={
				<div>
					<h2>Modal playground</h2>
					<p>Use the controls to test each presentation variant.</p>
				</div>
			}
		/>
	</>
);

Playground.args = {
	variant: 'modal',
	isOpen: true,
	modalID: 'playground',
};